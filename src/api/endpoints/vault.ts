import { apiClient } from "@/api/client";
import { mapVaultItemToRow } from "@/api/mappers/vault.mapper";
import type { ApiEnvelope, VaultRowDto } from "@/types/api";
import type { VaultItem } from "@/types/entities";

export const listVaultItems = (envelope: ApiEnvelope<Record<string, never>>) =>
  apiClient.post<Record<string, never>, VaultRowDto[]>("vault/list", envelope);

export const upsertVaultItem = (envelope: ApiEnvelope<{ item: VaultItem }>) =>
  apiClient.post<{ item: VaultRowDto }, { id: string }>("vault/upsert", {
    ...envelope,
    payload: {
      item: mapVaultItemToRow(envelope.payload.item),
    },
  });

export const deleteVaultItem = (envelope: ApiEnvelope<{ id: string }>) =>
  apiClient.post<{ id: string }, { id: string }>("vault/delete", envelope);
