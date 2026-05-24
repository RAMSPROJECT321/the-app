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
import type {
  AttachmentSyncState,
  BaseEntity,
  ChecklistItem,
  Task,
  TaskAttachment,
  TaskTimelineEvent,
} from "@/types/entities";

interface SnapshotMeta {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

const collectionPath = (userId: string) =>
  collection(getFirestoreDb(), "users", userId, "tasks");

const serializeTask = ({ syncState, ...task }: Task) => ({
  ...task,
  attachments: [],
});

const parseChecklist = (value: unknown): ChecklistItem[] =>
  Array.isArray(value)
    ? value.map((item) => ({
        id: typeof item?.id === "string" ? item.id : "",
        label: typeof item?.label === "string" ? item.label : "",
        completed: Boolean(item?.completed),
      }))
    : [];

const parseTimeline = (value: unknown): TaskTimelineEvent[] =>
  Array.isArray(value)
    ? value.map((item) => ({
        id: typeof item?.id === "string" ? item.id : "",
        type:
          item?.type === "created" ||
          item?.type === "edited" ||
          item?.type === "status_changed" ||
          item?.type === "voice_capture" ||
          item?.type === "attachment_added"
            ? item.type
            : "edited",
        message: typeof item?.message === "string" ? item.message : "",
        createdAt:
          typeof item?.createdAt === "string" ? item.createdAt : new Date().toISOString(),
      }))
    : [];

const parseAttachmentSyncState = (value: unknown): AttachmentSyncState => {
  switch (value) {
    case "local_only":
    case "local_pending":
    case "uploading":
    case "uploaded":
    case "failed":
      return value;
    default:
      return "local_only";
  }
};

const parseAttachments = (value: unknown): TaskAttachment[] =>
  Array.isArray(value)
    ? value.map((item) => ({
        id: typeof item?.id === "string" ? item.id : "",
        name: typeof item?.name === "string" ? item.name : "Attachment",
        mimeType:
          typeof item?.mimeType === "string" ? item.mimeType : "application/octet-stream",
        sizeInBytes:
          typeof item?.sizeInBytes === "number" ? item.sizeInBytes : Number(item?.sizeInBytes ?? 0),
        createdAt:
          typeof item?.createdAt === "string" ? item.createdAt : new Date().toISOString(),
        syncState: parseAttachmentSyncState(item?.syncState),
        remotePath: typeof item?.remotePath === "string" ? item.remotePath : undefined,
        remoteUrl: typeof item?.remoteUrl === "string" ? item.remoteUrl : undefined,
      }))
    : [];

const buildSyncState = (
  snapshot: QuerySnapshot,
): BaseEntity["syncState"] => (snapshot.metadata.hasPendingWrites ? "pending" : "synced");

const mapTask = (
  userId: string,
  snapshot: QuerySnapshot,
): Task[] =>
  snapshot.docs.map((taskDoc) => {
    const data = taskDoc.data();

    return {
      id: typeof data.id === "string" ? data.id : taskDoc.id,
      userId,
      title: typeof data.title === "string" ? data.title : "",
      description: typeof data.description === "string" ? data.description : "",
      status:
        data.status === "pending" || data.status === "in_progress" || data.status === "completed"
          ? data.status
          : "pending",
      priority:
        data.priority === "low" || data.priority === "medium" || data.priority === "high"
          ? data.priority
          : "medium",
      tags: Array.isArray(data.tags)
        ? data.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      checklist: parseChecklist(data.checklist),
      attachments: parseAttachments(data.attachments),
      timeline: parseTimeline(data.timeline),
      createdAt:
        typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
      updatedAt:
        typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
      version: typeof data.version === "number" ? data.version : Number(data.version ?? 1),
      syncState: buildSyncState(snapshot),
    };
  });

export const tasksRepository = {
  subscribe(userId: string, onTasks: (tasks: Task[], meta: SnapshotMeta) => void): Unsubscribe {
    return onSnapshot(
      query(collectionPath(userId), orderBy("updatedAt", "desc")),
      (snapshot) => {
        onTasks(mapTask(userId, snapshot), {
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });
      },
    );
  },

  async upsertTaskAsync(task: Task) {
    await setDoc(doc(collectionPath(task.userId), task.id), serializeTask(task));
  },

  async deleteTaskAsync(userId: string, taskId: string) {
    await deleteDoc(doc(collectionPath(userId), taskId));
  },
};
