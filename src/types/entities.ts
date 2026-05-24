export type EntitySyncState = "synced" | "pending" | "failed" | "local_only";
export type AttachmentSyncState =
  | "local_only"
  | "local_pending"
  | "uploading"
  | "uploaded"
  | "failed";

export interface BaseEntity {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  syncState: EntitySyncState;
}

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface TaskTimelineEvent {
  id: string;
  type: "created" | "edited" | "status_changed" | "voice_capture" | "attachment_added";
  message: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeInBytes: number;
  createdAt: string;
  syncState: AttachmentSyncState;
  localUri?: string;
  remotePath?: string;
  remoteUrl?: string;
  errorMessage?: string;
}

export interface Task extends BaseEntity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  checklist: ChecklistItem[];
  attachments: TaskAttachment[];
  timeline: TaskTimelineEvent[];
}

export type VaultCategory =
  | "password"
  | "api_key"
  | "link"
  | "note"
  | "secure_text";

export type VaultSyncMode = "local_only_secure" | "metadata_synced";

export interface VaultItem extends BaseEntity {
  title: string;
  category: VaultCategory;
  username?: string;
  url?: string;
  notes?: string;
  secretRef: string;
  secretPreview: string;
  isFavorite: boolean;
  syncMode: VaultSyncMode;
}

export interface DashboardInsightCard {
  id: string;
  label: string;
  value: string;
  tone: "accent" | "success" | "warning" | "vault";
  helper: string;
}
