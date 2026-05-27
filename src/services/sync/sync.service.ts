import { APP_MESSAGES, hasFirebaseConfig } from "@/constants/app";
import { waitForRemoteWritesAsync } from "@/services/firebase/firebase-app";
import { tasksRepository } from "@/services/repositories/tasks.repository";
import { vaultRepository } from "@/services/repositories/vault.repository";
import { useConnectivityStore } from "@/store/connectivity-store";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import { useTasksStore } from "@/store/tasks-store";
import { useVaultStore } from "@/store/vault-store";
import { debugLogger } from "@/utils/debug";

let tasksUnsubscribe: (() => void) | null = null;
let vaultUnsubscribe: (() => void) | null = null;
let activeUserId: string | null = null;

const mapSyncErrorMessage = (code?: string) => {
  if (code === "permission-denied") {
    return APP_MESSAGES.firestorePermissionDenied;
  }

  return "Realtime sync failed. Check the console logs for the exact Firebase operation and error.";
};

const handleRealtimeError = (
  scope: "tasks" | "vault",
  userId: string,
  error: { code?: string; message: string },
) => {
  debugLogger.error("sync", "realtime listener error", {
    scope,
    userId,
    code: error.code,
    message: error.message,
  });

  useSyncStore
    .getState()
    .setError(error.code ?? "unknown", `${mapSyncErrorMessage(error.code)} (${scope})`);
};

const updateStatusFromSnapshot = (meta: {
  fromCache: boolean;
  hasPendingWrites: boolean;
}) => {
  if (meta.hasPendingWrites) {
    useSyncStore.getState().setStatus("syncing");
    return;
  }

  if (!useConnectivityStore.getState().isConnected && meta.fromCache) {
    useSyncStore.getState().setStatus("offline");
    return;
  }

  useSyncStore.getState().setStatus("idle");
  useSyncStore.getState().clearError();

  if (!meta.fromCache) {
    useSyncStore.getState().setLastSyncedAt(new Date().toISOString());
  }
};

export const syncService = {
  async initializeDataAsync() {
    const userId = useSessionStore.getState().userId;

    if (!userId) {
      debugLogger.log("sync", "initialize requested without signed-in user");
      return {
        mode: "signed_out",
        message: "Sign in to load your workspace.",
      };
    }

    return this.startRealtimeSyncAsync(userId);
  },

  async startRealtimeSyncAsync(userId: string) {
    if (!hasFirebaseConfig) {
      debugLogger.warn("sync", "start requested without firebase config");
      return {
        started: false,
        message: APP_MESSAGES.missingFirebaseConfig,
      };
    }

    if (activeUserId === userId && tasksUnsubscribe && vaultUnsubscribe) {
      debugLogger.log("sync", "reusing existing realtime listeners", { userId });
      return this.syncNowAsync();
    }

    this.stopRealtimeSync();
    activeUserId = userId;
    useSyncStore.getState().clearError();
    debugLogger.log("sync", "starting realtime sync", { userId });

    tasksUnsubscribe = tasksRepository.subscribe(
      userId,
      (tasks, meta) => {
        useTasksStore.getState().replaceAllFromRemote(tasks, {
          userId,
          preserveLocalSynced:
            meta.fromCache && !useConnectivityStore.getState().isConnected,
        });
        updateStatusFromSnapshot(meta);
      },
      (error) => {
        handleRealtimeError("tasks", userId, error);
      },
    );

    vaultUnsubscribe = vaultRepository.subscribe(
      userId,
      (items, meta) => {
        useVaultStore.getState().replaceAllFromRemote(items, {
          userId,
          preserveLocalSynced:
            meta.fromCache && !useConnectivityStore.getState().isConnected,
        });
        updateStatusFromSnapshot(meta);
      },
      (error) => {
        handleRealtimeError("vault", userId, error);
      },
    );

    if (useConnectivityStore.getState().isConnected) {
      return this.syncNowAsync();
    }

    useSyncStore.getState().setStatus("offline");

    return {
      started: true,
      message: "Offline mode active. Cached Firebase data remains available.",
    };
  },

  stopRealtimeSync() {
    debugLogger.log("sync", "stopping realtime sync", { userId: activeUserId });
    tasksUnsubscribe?.();
    vaultUnsubscribe?.();
    tasksUnsubscribe = null;
    vaultUnsubscribe = null;
    activeUserId = null;
  },

  async syncNowAsync() {
    if (!hasFirebaseConfig) {
      debugLogger.warn("sync", "manual sync requested without firebase config");
      return {
        syncedCount: 0,
        pulled: false,
        message: APP_MESSAGES.missingFirebaseConfig,
      };
    }

    const userId = useSessionStore.getState().userId;

    if (!userId) {
      debugLogger.warn("sync", "manual sync requested without signed-in user");
      return {
        syncedCount: 0,
        pulled: false,
        message: "Sign in to enable sync.",
      };
    }

    if (!useConnectivityStore.getState().isConnected) {
      useSyncStore.getState().setStatus("offline");
      debugLogger.log("sync", "manual sync skipped because device is offline", { userId });
      return {
        syncedCount: 0,
        pulled: false,
        message: "Offline mode active. Cached data remains available.",
      };
    }

    useSyncStore.getState().setStatus("syncing");
    useSyncStore.getState().clearError();
    debugLogger.log("sync", "retrying unsynced local changes", { userId });

    try {
      const [taskRetryResult, vaultRetryResult] = await Promise.all([
        useTasksStore.getState().retryUnsyncedTasksAsync(userId),
        useVaultStore.getState().retryUnsyncedVaultItemsAsync(userId),
      ]);

      debugLogger.log("sync", "waiting for remote writes", {
        userId,
        taskRetryResult,
        vaultRetryResult,
      });

      await waitForRemoteWritesAsync();
      useSyncStore.getState().setStatus("idle");
      useSyncStore.getState().setLastSyncedAt(new Date().toISOString());
      debugLogger.log("sync", "manual sync completed", { userId });

      return {
        syncedCount:
          taskRetryResult.upserts +
          taskRetryResult.deletes +
          vaultRetryResult.upserts +
          vaultRetryResult.deletes,
        pulled: true,
        message: "Firebase sync is up to date. Task attachments remain on this device only.",
      };
    } catch (error) {
      const code =
        typeof error === "object" &&
        error &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : "unknown";
      const message = mapSyncErrorMessage(code);

      useSyncStore.getState().setError(code, message);
      debugLogger.error("sync", "manual sync failed", {
        userId,
        code,
        error,
      });

      return {
        syncedCount: 0,
        pulled: false,
        message,
      };
    }
  },
};
