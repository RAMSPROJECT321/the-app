export type SyncEntityType = "task" | "vault";
export type SyncOperation = "upsert" | "delete";
export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export interface SyncQueueItem {
  id: string;
  entityId: string;
  entityType: SyncEntityType;
  operation: SyncOperation;
  updatedAt: string;
  attemptCount: number;
  errorMessage?: string;
}
