import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AttachmentUploadQueueItem, SyncStatus } from "@/types/sync";

interface SyncState {
  hydrated: boolean;
  queue: AttachmentUploadQueueItem[];
  lastSyncedAt?: string;
  status: SyncStatus;
  errorCode?: string;
  errorMessage?: string;
  setHydrated: (hydrated: boolean) => void;
  enqueueUpload: (item: AttachmentUploadQueueItem) => void;
  markUploaded: (queueItemId: string) => void;
  markFailed: (queueItemId: string, errorMessage: string) => void;
  setStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (timestamp: string) => void;
  setError: (errorCode: string, errorMessage: string) => void;
  clearError: () => void;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      hydrated: false,
      queue: [],
      lastSyncedAt: undefined,
      status: "idle",
      errorCode: undefined,
      errorMessage: undefined,
      setHydrated: (hydrated) => set({ hydrated }),
      enqueueUpload: (item) =>
        set((state) => ({
          queue: [
            item,
            ...state.queue.filter(
              (queued) =>
                !(
                  queued.userId === item.userId &&
                  queued.taskId === item.taskId &&
                  queued.attachmentId === item.attachmentId
                ),
            ),
          ],
        })),
      markUploaded: (queueItemId) =>
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
      setError: (errorCode, errorMessage) =>
        set({
          status: "error",
          errorCode,
          errorMessage,
        }),
      clearError: () =>
        set({
          errorCode: undefined,
          errorMessage: undefined,
        }),
      clearQueue: () =>
        set({
          queue: [],
          status: "idle",
          errorCode: undefined,
          errorMessage: undefined,
        }),
    }),
    {
      name: "sync-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        queue: state.queue,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
