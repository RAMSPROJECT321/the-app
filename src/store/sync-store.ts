import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SyncQueueItem, SyncStatus } from "@/types/sync";

interface SyncState {
  hydrated: boolean;
  queue: SyncQueueItem[];
  lastSyncedAt?: string;
  status: SyncStatus;
  setHydrated: (hydrated: boolean) => void;
  enqueue: (item: SyncQueueItem) => void;
  markSynced: (queueItemId: string) => void;
  markFailed: (queueItemId: string, errorMessage: string) => void;
  setStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (timestamp: string) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      hydrated: false,
      queue: [],
      lastSyncedAt: undefined,
      status: "idle",
      setHydrated: (hydrated) => set({ hydrated }),
      enqueue: (item) =>
        set((state) => ({
          queue: [
            item,
            ...state.queue.filter(
              (queued) =>
                !(
                  queued.entityId === item.entityId &&
                  queued.entityType === item.entityType
                ),
            ),
          ],
        })),
      markSynced: (queueItemId) =>
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== queueItemId),
        })),
      markFailed: (queueItemId, errorMessage) =>
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === queueItemId
              ? {
                  ...item,
                  attemptCount: item.attemptCount + 1,
                  errorMessage,
                }
              : item,
          ),
        })),
      setStatus: (status) => set({ status }),
      setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
    }),
    {
      name: "sync-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
