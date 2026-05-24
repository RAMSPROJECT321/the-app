import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SyncQueueItem, SyncStatus } from "@/types/sync";

interface SyncState {
  queue: SyncQueueItem[];
  lastSyncedAt?: string;
  status: SyncStatus;
  enqueue: (item: SyncQueueItem) => void;
  markSynced: (queueItemId: string) => void;
  markFailed: (queueItemId: string, errorMessage: string) => void;
  setStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (timestamp: string) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      queue: [],
      lastSyncedAt: undefined,
      status: "idle",
      enqueue: (item) =>
        set((state) => ({
          queue: [item, ...state.queue.filter((queued) => queued.id !== item.id)],
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
    },
  ),
);
