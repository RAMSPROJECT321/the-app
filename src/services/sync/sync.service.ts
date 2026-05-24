import { APP_MESSAGES, hasFirebaseConfig } from "@/constants/app";
import { waitForRemoteWritesAsync } from "@/services/firebase/firebase-app";
import { tasksRepository } from "@/services/repositories/tasks.repository";
import { vaultRepository } from "@/services/repositories/vault.repository";
import { useConnectivityStore } from "@/store/connectivity-store";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import { useTasksStore } from "@/store/tasks-store";
import { useVaultStore } from "@/store/vault-store";

let tasksUnsubscribe: (() => void) | null = null;
let vaultUnsubscribe: (() => void) | null = null;
let activeUserId: string | null = null;

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

  if (!meta.fromCache) {
    useSyncStore.getState().setLastSyncedAt(new Date().toISOString());
  }
};

export const syncService = {
  async initializeDataAsync() {
    const userId = useSessionStore.getState().userId;

    if (!userId) {
      return {
        mode: "signed_out",
        message: "Sign in to load your workspace.",
      };
    }

    return this.startRealtimeSyncAsync(userId);
  },

  async startRealtimeSyncAsync(userId: string) {
    if (!hasFirebaseConfig) {
      return {
        started: false,
        message: APP_MESSAGES.missingFirebaseConfig,
      };
    }

    if (activeUserId === userId && tasksUnsubscribe && vaultUnsubscribe) {
      return this.syncNowAsync();
    }

    this.stopRealtimeSync();
    activeUserId = userId;

    tasksUnsubscribe = tasksRepository.subscribe(userId, (tasks, meta) => {
      useTasksStore.getState().replaceAllFromRemote(tasks);
      updateStatusFromSnapshot(meta);
    });

    vaultUnsubscribe = vaultRepository.subscribe(userId, (items, meta) => {
      useVaultStore.getState().replaceAllFromRemote(items);
      updateStatusFromSnapshot(meta);
    });

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
    tasksUnsubscribe?.();
    vaultUnsubscribe?.();
    tasksUnsubscribe = null;
    vaultUnsubscribe = null;
    activeUserId = null;
  },

  async syncNowAsync() {
    if (!hasFirebaseConfig) {
      return {
        syncedCount: 0,
        pulled: false,
        message: APP_MESSAGES.missingFirebaseConfig,
      };
    }

    const userId = useSessionStore.getState().userId;

    if (!userId) {
      return {
        syncedCount: 0,
        pulled: false,
        message: "Sign in to enable sync.",
      };
    }

    if (!useConnectivityStore.getState().isConnected) {
      useSyncStore.getState().setStatus("offline");
      return {
        syncedCount: 0,
        pulled: false,
        message: "Offline mode active. Cached data remains available.",
      };
    }

    useSyncStore.getState().setStatus("syncing");
    await waitForRemoteWritesAsync();
    useSyncStore.getState().setStatus("idle");
    useSyncStore.getState().setLastSyncedAt(new Date().toISOString());

    return {
      syncedCount: 0,
      pulled: true,
      message: "Firebase sync is up to date. Task attachments remain on this device only.",
    };
  },
};
