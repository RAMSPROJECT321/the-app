import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { vaultRepository } from "@/services/repositories/vault.repository";
import { secureStorageService } from "@/services/secure/secure-storage.service";
import { useSessionStore } from "@/store/session-store";
import type { VaultCategory, VaultItem, VaultSyncMode } from "@/types/entities";
import { createId } from "@/utils/id";
import { buildVaultSecretKey, maskSecret } from "@/utils/vault";

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
  hydrated: boolean;
  itemsById: Record<string, VaultItem>;
  itemIds: string[];
  setHydrated: (hydrated: boolean) => void;
  replaceAllFromRemote: (items: VaultItem[]) => void;
  clearAll: () => void;
  saveVaultItemAsync: (input: SaveVaultInput, itemId?: string) => Promise<string>;
  deleteVaultItemAsync: (itemId: string) => Promise<void>;
  toggleFavorite: (itemId: string) => void;
}

const upsertVaultState = (
  state: Pick<VaultState, "itemsById" | "itemIds">,
  item: VaultItem,
) => {
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
      hydrated: false,
      itemsById: {},
      itemIds: [],
      setHydrated: (hydrated) => set({ hydrated }),
      replaceAllFromRemote: (items) =>
        set({
          itemsById: Object.fromEntries(items.map((item) => [item.id, item])),
          itemIds: items
            .slice()
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
            .map((item) => item.id),
        }),
      clearAll: () =>
        set({
          itemsById: {},
          itemIds: [],
        }),
      saveVaultItemAsync: async (input, itemId) => {
        const userId = useSessionStore.getState().userId;

        if (!userId) {
          return "";
        }

        const now = new Date().toISOString();
        const existing = itemId ? get().itemsById[itemId] : undefined;
        const nextItemId = itemId ?? createId("vault");
        const secretRef = buildVaultSecretKey(userId, nextItemId);

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
          syncMode: input.syncMode ?? existing?.syncMode ?? "metadata_synced",
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          version: (existing?.version ?? 0) + 1,
          syncState: "pending",
        };

        set((state) => ({
          ...upsertVaultState(state, nextItem),
        }));

        try {
          await vaultRepository.upsertVaultItemAsync(nextItem);
        } catch {
          set((state) => ({
            ...upsertVaultState(state, {
              ...nextItem,
              syncState: "failed",
            }),
          }));
        }

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

        try {
          await vaultRepository.deleteVaultItemAsync(item.userId, itemId);
        } catch {
          set((state) => ({
            ...upsertVaultState(state, {
              ...item,
              syncState: "failed",
            }),
          }));
        }
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
        void vaultRepository.upsertVaultItemAsync(nextItem).catch(() => {
          set((state) => ({
            ...upsertVaultState(state, {
              ...nextItem,
              syncState: "failed",
            }),
          }));
        });
      },
    }),
    {
      name: "vault-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        itemsById: state.itemsById,
        itemIds: state.itemIds,
      }),
    },
  ),
);
