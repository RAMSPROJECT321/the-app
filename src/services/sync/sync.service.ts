import { ApiClientError } from "@/api/client";
import { listTasks, deleteTask, upsertTask } from "@/api/endpoints/tasks";
import { listVaultItems, deleteVaultItem, upsertVaultItem } from "@/api/endpoints/vault";
import { mapTaskRowToTask } from "@/api/mappers/task.mapper";
import { mapVaultRowToItem } from "@/api/mappers/vault.mapper";
import { APP_CONFIG, APP_MESSAGES } from "@/constants/app";
import { useConnectivityStore } from "@/store/connectivity-store";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import { useTasksStore } from "@/store/tasks-store";
import { useVaultStore } from "@/store/vault-store";
import type { SyncQueueItem } from "@/types/sync";
import { createId } from "@/utils/id";

const buildEnvelope = <TPayload,>(payload: TPayload) => {
  const session = useSessionStore.getState();
  const sync = useSyncStore.getState();

  return {
    requestId: createId("request"),
    deviceId: session.deviceId,
    userId: session.userId,
    lastSyncedAt: sync.lastSyncedAt,
    payload,
  };
};

const hasConfiguredApi = () => Boolean(APP_CONFIG.googleAppsScriptBaseUrl);

const processQueueItemAsync = async (item: SyncQueueItem) => {
  if (item.entityType === "task") {
    if (item.operation === "delete") {
      await deleteTask(buildEnvelope({ id: item.entityId }));
      return;
    }

    const task = useTasksStore.getState().tasksById[item.entityId];

    if (task) {
      await upsertTask(buildEnvelope({ task }));
    }

    return;
  }

  if (item.operation === "delete") {
    await deleteVaultItem(buildEnvelope({ id: item.entityId }));
    return;
  }

  const vaultItem = useVaultStore.getState().itemsById[item.entityId];

  if (vaultItem) {
    await upsertVaultItem(buildEnvelope({ item: vaultItem }));
  }
};

const applyRemoteSnapshotAsync = async () => {
  const [tasksResponse, vaultResponse] = await Promise.all([
    listTasks(buildEnvelope({})),
    listVaultItems(buildEnvelope({})),
  ]);

  const tasks = tasksResponse.data.map(mapTaskRowToTask);
  const vaultItems = vaultResponse.data.map(mapVaultRowToItem);

  useTasksStore.getState().replaceAllFromRemote(tasks);
  useVaultStore.getState().replaceAllFromRemote(vaultItems);
  useSyncStore.getState().setLastSyncedAt(new Date().toISOString());

  return {
    tasksCount: tasks.length,
    vaultCount: vaultItems.length,
  };
};

export const syncService = {
  async initializeDataAsync() {
    if (!hasConfiguredApi()) {
      return {
        mode: "local_demo",
        message: APP_MESSAGES.missingAppsScript,
      };
    }

    if (!useConnectivityStore.getState().isConnected) {
      return {
        mode: "local_cache",
        message: "Offline mode active. Using persisted local data.",
      };
    }

    return this.syncNowAsync();
  },

  async pullLatestAsync() {
    if (!hasConfiguredApi()) {
      return {
        pulled: false,
        message: APP_MESSAGES.missingAppsScript,
      };
    }

    if (!useConnectivityStore.getState().isConnected) {
      useSyncStore.getState().setStatus("offline");
      return {
        pulled: false,
        message: "Offline mode active. Local data remains available.",
      };
    }

    try {
      useSyncStore.getState().setStatus("syncing");
      const snapshot = await applyRemoteSnapshotAsync();
      useSyncStore.getState().setStatus("idle");

      return {
        pulled: true,
        message: `Loaded ${snapshot.tasksCount} tasks and ${snapshot.vaultCount} vault rows from Sheets.`,
      };
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Unable to load remote data.";
      useSyncStore.getState().setStatus("error");

      return {
        pulled: false,
        message,
      };
    }
  },

  async syncPendingChangesAsync() {
    if (!hasConfiguredApi()) {
      return {
        syncedCount: 0,
        message: APP_MESSAGES.missingAppsScript,
      };
    }

    if (!useConnectivityStore.getState().isConnected) {
      useSyncStore.getState().setStatus("offline");
      return {
        syncedCount: 0,
        message: "Offline mode active. Changes remain queued locally.",
      };
    }

    const syncStore = useSyncStore.getState();
    const queue = [...syncStore.queue].sort((left, right) =>
      left.updatedAt.localeCompare(right.updatedAt),
    );

    if (queue.length === 0) {
      useSyncStore.getState().setStatus("idle");
      return {
        syncedCount: 0,
        message: "No queued local changes.",
      };
    }

    useSyncStore.getState().setStatus("syncing");

    let syncedCount = 0;

    for (const item of queue) {
      try {
        await processQueueItemAsync(item);
        syncedCount += 1;
        useSyncStore.getState().markSynced(item.id);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : "A sync request failed.";
        useSyncStore.getState().markFailed(item.id, message);
        useSyncStore.getState().setStatus("error");

        return {
          syncedCount,
          message,
        };
      }
    }

    useSyncStore.getState().setStatus("idle");

    return {
      syncedCount,
      message: "Queued local changes were pushed successfully.",
    };
  },

  async syncNowAsync() {
    if (!hasConfiguredApi()) {
      return {
        syncedCount: 0,
        pulled: false,
        message: APP_MESSAGES.missingAppsScript,
      };
    }

    if (!useConnectivityStore.getState().isConnected) {
      useSyncStore.getState().setStatus("offline");
      return {
        syncedCount: 0,
        pulled: false,
        message: "Offline mode active. Using persisted local data.",
      };
    }

    const pushResult = await this.syncPendingChangesAsync();

    if (useSyncStore.getState().status === "error") {
      return {
        syncedCount: pushResult.syncedCount,
        pulled: false,
        message: pushResult.message,
      };
    }

    const pullResult = await this.pullLatestAsync();

    return {
      syncedCount: pushResult.syncedCount,
      pulled: pullResult.pulled,
      message:
        pushResult.syncedCount > 0
          ? `${pushResult.message} ${pullResult.message}`
          : pullResult.message,
    };
  },
};
