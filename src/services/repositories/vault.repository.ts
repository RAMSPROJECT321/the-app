import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirestoreDb } from "@/services/firebase/firebase-app";
import type { BaseEntity, VaultItem } from "@/types/entities";
import { buildVaultSecretKey } from "@/utils/vault";

interface SnapshotMeta {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

const collectionPath = (userId: string) =>
  collection(getFirestoreDb(), "users", userId, "vaultItems");

const buildSyncState = (
  snapshot: QuerySnapshot,
): BaseEntity["syncState"] => (snapshot.metadata.hasPendingWrites ? "pending" : "synced");

const serializeVaultItem = ({ syncState, secretRef, ...item }: VaultItem) => ({
  ...item,
});

const mapVaultItems = (userId: string, snapshot: QuerySnapshot): VaultItem[] =>
  snapshot.docs.map((itemDoc) => {
    const data = itemDoc.data();
    const id = typeof data.id === "string" ? data.id : itemDoc.id;

    return {
      id,
      userId,
      title: typeof data.title === "string" ? data.title : "",
      category:
        data.category === "password" ||
        data.category === "api_key" ||
        data.category === "link" ||
        data.category === "note" ||
        data.category === "secure_text"
          ? data.category
          : "secure_text",
      username: typeof data.username === "string" ? data.username : undefined,
      url: typeof data.url === "string" ? data.url : undefined,
      notes: typeof data.notes === "string" ? data.notes : undefined,
      secretRef: buildVaultSecretKey(userId, id),
      secretPreview:
        typeof data.secretPreview === "string" ? data.secretPreview : "Not available",
      isFavorite: Boolean(data.isFavorite),
      syncMode: data.syncMode === "local_only_secure" ? data.syncMode : "metadata_synced",
      createdAt:
        typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
      updatedAt:
        typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
      version: typeof data.version === "number" ? data.version : Number(data.version ?? 1),
      syncState: buildSyncState(snapshot),
    };
  });

export const vaultRepository = {
  subscribe(
    userId: string,
    onItems: (items: VaultItem[], meta: SnapshotMeta) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(collectionPath(userId), orderBy("updatedAt", "desc")),
      (snapshot) => {
        onItems(mapVaultItems(userId, snapshot), {
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });
      },
    );
  },

  async upsertVaultItemAsync(item: VaultItem) {
    await setDoc(doc(collectionPath(item.userId), item.id), serializeVaultItem(item));
  },

  async deleteVaultItemAsync(userId: string, itemId: string) {
    await deleteDoc(doc(collectionPath(userId), itemId));
  },
};
