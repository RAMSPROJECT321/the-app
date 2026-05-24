import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { buildDemoVaultSeeds } from "@/features/vault/data/demo-vault";
import { secureStorageService } from "@/services/secure/secure-storage.service";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import type { VaultCategory, VaultItem, VaultSyncMode } from "@/types/entities";
import type { SyncQueueItem } from "@/types/sync";
import { createId } from "@/utils/id";
import { maskSecret } from "@/utils/vault";

interface SaveVaultInput {
  title: string;
  category: VaultCategory;
  secret: string;
  username?: string;
  url?: string;
  notes?: string;
  isFavorite?: boolean;
  syncMode?: VaultSyncMode;
}

interface VaultState {
  seededDemoData: boolean;
  itemsById: Record<string, VaultItem>;
  itemIds: string[];
  seedDemoDataAsync: () => Promise<void>;
  saveVaultItemAsync: (input: SaveVaultInput, itemId?: string) => Promise<string>;
  deleteVaultItemAsync: (itemId: string) => Promise<void>;
  toggleFavorite: (itemId: string) => void;
}

const enqueueVaultMutation = (entityId: string, operation: SyncQueueItem["operation"]) => {
  useSyncStore.getState().enqueue({
    id: createId("sync"),
    entityId,
    entityType: "vault",
    operation,
    updatedAt: new Date().toISOString(),
    attemptCount: 0,
  });
};

const upsertVaultState = (state: VaultState, item: VaultItem) => {
  const exists = Boolean(state.itemsById[item.id]);

  return {
    itemsById: {
      ...state.itemsById,
      [item.id]: item,
    },
    itemIds: exists ? state.itemIds : [item.id, ...state.itemIds],
  };
};

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      seededDemoData: false,
      itemsById: {},
      itemIds: [],
      seedDemoDataAsync: async () => {
        if (get().seededDemoData) {
          return;
        }

        const userId = useSessionStore.getState().userId;
        const now = new Date().toISOString();
        const demoSeeds = buildDemoVaultSeeds();

        for (const seed of demoSeeds) {
          await secureStorageService.setVaultSecret(seed.id, seed.secret);
        }

        const items = demoSeeds.map<VaultItem>((seed) => ({
          id: seed.id,
          userId,
          title: seed.title,
          category: seed.category,
          username: seed.username,
          url: seed.url,
          notes: seed.notes,
          secretRef: seed.id,
          secretPreview: maskSecret(seed.secret),
          isFavorite: seed.isFavorite,
          syncMode: seed.syncMode,
          createdAt: now,
          updatedAt: now,
          version: 1,
          syncState: "local_only",
        }));

        set({
          seededDemoData: true,
          itemsById: Object.fromEntries(items.map((item) => [item.id, item])),
          itemIds: items.map((item) => item.id),
        });
      },
      saveVaultItemAsync: async (input, itemId) => {
        const userId = useSessionStore.getState().userId;
        const now = new Date().toISOString();
        const existing = itemId ? get().itemsById[itemId] : undefined;
        const nextItemId = itemId ?? createId("vault");
        const secretRef = existing?.secretRef ?? createId("vault-secret");

        await secureStorageService.setVaultSecret(secretRef, input.secret);

        const nextItem: VaultItem = {
          id: nextItemId,
          userId,
          title: input.title,
          category: input.category,
          username: input.username,
          url: input.url,
          notes: input.notes,
          secretRef,
          secretPreview: maskSecret(input.secret),
          isFavorite: input.isFavorite ?? existing?.isFavorite ?? false,
          syncMode: input.syncMode ?? existing?.syncMode ?? "local_only_secure",
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          version: (existing?.version ?? 0) + 1,
          syncState: "pending",
        };

        set((state) => ({
          ...upsertVaultState(state, nextItem),
        }));
        enqueueVaultMutation(nextItem.id, "upsert");
        return nextItem.id;
      },
      deleteVaultItemAsync: async (itemId) => {
        const item = get().itemsById[itemId];

        if (!item) {
          return;
        }

        await secureStorageService.deleteVaultSecret(item.secretRef);
        set((state) => {
          const nextItems = { ...state.itemsById };
          delete nextItems[itemId];

          return {
            itemsById: nextItems,
            itemIds: state.itemIds.filter((id) => id !== itemId),
          };
        });
        enqueueVaultMutation(itemId, "delete");
      },
      toggleFavorite: (itemId) => {
        const item = get().itemsById[itemId];

        if (!item) {
          return;
        }

        const nextItem: VaultItem = {
          ...item,
          isFavorite: !item.isFavorite,
          updatedAt: new Date().toISOString(),
          version: item.version + 1,
          syncState: "pending",
        };

        set((state) => ({
          ...upsertVaultState(state, nextItem),
        }));
        enqueueVaultMutation(itemId, "upsert");
      },
    }),
    {
      name: "vault-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
