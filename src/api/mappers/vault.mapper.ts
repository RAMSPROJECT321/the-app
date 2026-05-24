import type { VaultRowDto } from "@/types/api";
import type { VaultItem } from "@/types/entities";

export const mapVaultRowToItem = (row: VaultRowDto): VaultItem => ({
  id: row.id,
  userId: row.userId,
  title: row.title,
  category: row.category as VaultItem["category"],
  username: row.username,
  url: row.url,
  notes: row.notes,
  secretRef: row.secretRef,
  secretPreview: row.secretPreview,
  isFavorite: row.isFavorite,
  syncMode: row.syncMode as VaultItem["syncMode"],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  version: row.version,
  syncState: "synced",
});

export const mapVaultItemToRow = (item: VaultItem): VaultRowDto => ({
  id: item.id,
  userId: item.userId,
  title: item.title,
  category: item.category,
  username: item.username,
  url: item.url,
  notes: item.notes,
  secretRef: item.secretRef,
  secretPreview: item.secretPreview,
  isFavorite: item.isFavorite,
  syncMode: item.syncMode,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  version: item.version,
});
