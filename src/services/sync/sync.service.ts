import { ApiClientError } from "@/api/client";
import { deleteTask, upsertTask } from "@/api/endpoints/tasks";
import { deleteVaultItem, upsertVaultItem } from "@/api/endpoints/vault";
import { APP_MESSAGES } from "@/constants/app";
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

export const syncService = {
  async syncPendingChangesAsync() {
    const syncStore = useSyncStore.getState();
    const queue = [...syncStore.queue];

    if (queue.length === 0) {
      return {
        syncedCount: 0,
        message: "Nothing to sync.",
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

        if (error instanceof ApiClientError && error.code === "not_configured") {
          useSyncStore.getState().setStatus("idle");
          return {
            syncedCount,
            message: APP_MESSAGES.missingAppsScript,
          };
        }

        useSyncStore.getState().setStatus("error");
        return {
          syncedCount,
          message,
        };
      }
    }

    useSyncStore.getState().setLastSyncedAt(new Date().toISOString());
    useSyncStore.getState().setStatus("idle");

    return {
      syncedCount,
      message: "Local changes are synced.",
    };
  },
};
