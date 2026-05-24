import { apiClient } from "@/api/client";
import type { ApiEnvelope } from "@/types/api";

export const pullSyncState = (
  envelope: ApiEnvelope<{
    lastSyncToken?: string;
  }>,
) => apiClient.post<typeof envelope.payload, Record<string, unknown>>("sync/pull", envelope);

export const pushSyncState = (
  envelope: ApiEnvelope<{
    changes: unknown[];
  }>,
) => apiClient.post<typeof envelope.payload, { accepted: number }>("sync/push", envelope);
