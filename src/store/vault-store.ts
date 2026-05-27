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
  pendingDeletesById: Record<string, VaultItem>;
  setHydrated: (hydrated: boolean) => void;
  replaceAllFromRemote: (
    items: VaultItem[],
    options?: {
      preserveLocalSynced?: boolean;
      userId?: string;
    },
  ) => void;
  retryUnsyncedVaultItemsAsync: (
    userId: string,
  ) => Promise<{
    upserts: number;
    deletes: number;
  }>;
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

const sortVaultItems = (itemsById: Record<string, VaultItem>) =>
  Object.values(itemsById).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );

const isUnsyncedVaultItem = (item: VaultItem) => item.syncState !== "synced";

const shouldPreferLocalVaultItem = (localItem: VaultItem, remoteItem: VaultItem) =>
  isUnsyncedVaultItem(localItem) &&
  (localItem.version > remoteItem.version ||
    localItem.updatedAt > remoteItem.updatedAt);

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      itemsById: {},
      itemIds: [],
      pendingDeletesById: {},
      setHydrated: (hydrated) => set({ hydrated }),
      replaceAllFromRemote: (items, options) =>
        set((state) => {
          const targetUserId =
            options?.userId ??
            items[0]?.userId ??
            useSessionStore.getState().userId;

          if (!targetUserId) {
            return state;
          }

          const otherUsersItems = Object.fromEntries(
            Object.entries(state.itemsById).filter(
              ([, item]) => item.userId !== targetUserId,
            ),
          );
          const currentUserItems = Object.fromEntries(
            Object.entries(state.itemsById).filter(
              ([, item]) => item.userId === targetUserId,
            ),
          );
          const otherUsersPendingDeletes = Object.fromEntries(
            Object.entries(state.pendingDeletesById).filter(
              ([, item]) => item.userId !== targetUserId,
            ),
          );
          const currentUserPendingDeletes = Object.fromEntries(
            Object.entries(state.pendingDeletesById).filter(
              ([, item]) => item.userId === targetUserId,
            ),
          );
          const nextUserItemsById: Record<string, VaultItem> = {};

          for (const remoteItem of items) {
            if (currentUserPendingDeletes[remoteItem.id]) {
              continue;
            }

            const existing = currentUserItems[remoteItem.id];

            if (existing && shouldPreferLocalVaultItem(existing, remoteItem)) {
              nextUserItemsById[remoteItem.id] = existing;
              continue;
            }

            nextUserItemsById[remoteItem.id] = existing
              ? {
                  ...remoteItem,
                  secretRef: existing.secretRef,
                }
              : remoteItem;
          }

          for (const localItem of Object.values(currentUserItems)) {
            if (
              nextUserItemsById[localItem.id] ||
              currentUserPendingDeletes[localItem.id]
            ) {
              continue;
            }

            if (options?.preserveLocalSynced || isUnsyncedVaultItem(localItem)) {
              nextUserItemsById[localItem.id] = localItem;
            }
          }

          const itemsById = {
            ...otherUsersItems,
            ...nextUserItemsById,
          };

          return {
            itemsById,
            itemIds: sortVaultItems(itemsById).map((item) => item.id),
            pendingDeletesById: {
              ...otherUsersPendingDeletes,
              ...currentUserPendingDeletes,
            },
          };
        }),
      retryUnsyncedVaultItemsAsync: async (userId) => {
        const { itemsById, pendingDeletesById } = get();
        const unsyncedItems = Object.values(itemsById).filter(
          (item) => item.userId === userId && item.syncState !== "synced",
        );
        const pendingDeletes = Object.values(pendingDeletesById).filter(
          (item) => item.userId === userId,
        );

        await Promise.all(
          unsyncedItems.map(async (item) => {
            const nextItem = {
              ...item,
              syncState: "pending" as const,
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
          }),
        );

        await Promise.all(
          pendingDeletes.map(async (item) => {
            set((state) => ({
              pendingDeletesById: {
                ...state.pendingDeletesById,
                [item.id]: {
                  ...item,
                  syncState: "pending",
                },
              },
            }));

            try {
              await vaultRepository.deleteVaultItemAsync(item.userId, item.id);
              set((state) => {
                const nextPendingDeletes = { ...state.pendingDeletesById };
                delete nextPendingDeletes[item.id];

                return {
                  pendingDeletesById: nextPendingDeletes,
                };
              });
            } catch {
              set((state) => ({
                pendingDeletesById: {
                  ...state.pendingDeletesById,
                  [item.id]: {
                    ...item,
                    syncState: "failed",
                  },
                },
              }));
            }
          }),
        );

        return {
          upserts: unsyncedItems.length,
          deletes: pendingDeletes.length,
        };
      },
      clearAll: () =>
        set({
          itemsById: {},
          itemIds: [],
          pendingDeletesById: {},
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
            pendingDeletesById: {
              ...state.pendingDeletesById,
              [itemId]: {
                ...item,
                syncState: "pending",
              },
            },
          };
        });

        try {
          await vaultRepository.deleteVaultItemAsync(item.userId, itemId);
          set((state) => {
            const nextPendingDeletes = { ...state.pendingDeletesById };
            delete nextPendingDeletes[itemId];

            return {
              pendingDeletesById: nextPendingDeletes,
            };
          });
        } catch {
          set((state) => ({
            pendingDeletesById: {
              ...state.pendingDeletesById,
              [itemId]: {
                ...item,
                syncState: "failed",
              },
            },
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
        pendingDeletesById: state.pendingDeletesById,
      }),
    },
  ),
);
