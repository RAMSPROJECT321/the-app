export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export interface AttachmentUploadQueueItem {
  id: string;
  userId: string;
  taskId: string;
  attachmentId: string;
  localUri: string;
  name: string;
  mimeType: string;
  sizeInBytes: number;
  updatedAt: string;
  attemptCount: number;
  errorMessage?: string;
}
