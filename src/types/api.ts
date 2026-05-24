export interface ApiEnvelope<TPayload> {
  requestId: string;
  userId: string;
  deviceId: string;
  lastSyncedAt?: string;
  payload: TPayload;
}

export interface ApiResponse<TData> {
  success: boolean;
  data: TData;
  serverTime: string;
  syncToken?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface ApiErrorShape {
  code:
    | "not_configured"
    | "network"
    | "validation"
    | "unauthorized"
    | "server"
    | "unknown";
  message: string;
  status?: number;
}

export interface TaskRowDto {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tags: string;
  checklist: string;
  attachments: string;
  timeline: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  deletedAt?: string;
}

export interface VaultRowDto {
  id: string;
  userId: string;
  title: string;
  category: string;
  username?: string;
  url?: string;
  notes?: string;
  secretPreview: string;
  secretRef: string;
  isFavorite: boolean;
  syncMode: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  deletedAt?: string;
}
