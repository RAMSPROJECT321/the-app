import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { fileService } from "@/services/files/file.service";
import { tasksRepository } from "@/services/repositories/tasks.repository";
import { useSessionStore } from "@/store/session-store";
import type { Task, TaskAttachment, TaskPriority, TaskStatus } from "@/types/entities";
import { createId } from "@/utils/id";

interface CreateTaskInput {
  title: string;
  description: string;
  tags?: string[];
  status?: TaskStatus;
  priority?: TaskPriority;
}

interface TasksState {
  hydrated: boolean;
  tasksById: Record<string, Task>;
  taskIds: string[];
  pendingDeletesById: Record<string, Task>;
  setHydrated: (hydrated: boolean) => void;
  replaceAllFromRemote: (
    tasks: Task[],
    options?: {
      preserveLocalSynced?: boolean;
      userId?: string;
    },
  ) => void;
  retryUnsyncedTasksAsync: (
    userId: string,
  ) => Promise<{
    upserts: number;
    deletes: number;
  }>;
  clearAll: () => void;
  createTask: (input: CreateTaskInput) => string;
  createTaskFromVoiceTranscript: (transcript: string) => string;
  updateTask: (
    taskId: string,
    patch: Partial<
      Pick<Task, "title" | "description" | "status" | "priority" | "tags">
    >,
  ) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  addChecklistItem: (taskId: string, label: string) => void;
  addAttachment: (taskId: string, attachment: TaskAttachment) => void;
  appendVoiceTranscript: (taskId: string, transcript: string) => void;
  pruneMissingAttachmentsAsync: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  markCompleted: (taskId: string) => Promise<void>;
}

const sortTaskIds = (tasks: Task[]) =>
  tasks
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((task) => task.id);

const sortTasks = (tasksById: Record<string, Task>) =>
  Object.values(tasksById).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );

const isUnsyncedTask = (task: Task) => task.syncState !== "synced";

const shouldPreferLocalTask = (localTask: Task, remoteTask: Task) =>
  isUnsyncedTask(localTask) &&
  (localTask.version > remoteTask.version ||
    localTask.updatedAt > remoteTask.updatedAt);

const upsertTaskState = (
  state: Pick<TasksState, "tasksById" | "taskIds">,
  nextTask: Task,
  options?: {
    prepend?: boolean;
  },
) => {
  const exists = Boolean(state.tasksById[nextTask.id]);
  const taskIds = exists
    ? state.taskIds
    : options?.prepend
      ? [nextTask.id, ...state.taskIds]
      : [...state.taskIds, nextTask.id];

  return {
    tasksById: {
      ...state.tasksById,
      [nextTask.id]: nextTask,
    },
    taskIds,
  };
};

const removeTaskFromState = (
  state: Pick<TasksState, "tasksById" | "taskIds">,
  taskId: string,
) => {
  const nextTasks = { ...state.tasksById };
  delete nextTasks[taskId];

  return {
    tasksById: nextTasks,
    taskIds: state.taskIds.filter((id) => id !== taskId),
  };
};

const mergeAttachments = (
  existingAttachments: TaskAttachment[],
  incomingAttachments: TaskAttachment[],
) => {
  const incomingById = new Map(
    incomingAttachments.map((attachment) => [attachment.id, attachment]),
  );
  const merged: TaskAttachment[] = incomingAttachments.map((attachment) => {
    const existing = existingAttachments.find(
      (candidate) => candidate.id === attachment.id,
    );

    return {
      ...attachment,
      localUri: attachment.localUri ?? existing?.localUri,
      errorMessage: attachment.errorMessage ?? existing?.errorMessage,
      syncState:
        attachment.syncState === "local_only" || existing?.localUri
          ? "local_only"
          : attachment.syncState,
    };
  });

  for (const attachment of existingAttachments) {
    if (!incomingById.has(attachment.id)) {
      merged.push(attachment);
    }
  }

  return merged.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

const withTimelineUpdate = (
  task: Task,
  message: string,
  type: Task["timeline"][number]["type"],
) => ({
  ...task,
  timeline: [
    {
      id: createId("timeline"),
      type,
      message,
      createdAt: new Date().toISOString(),
    },
    ...task.timeline,
  ],
  updatedAt: new Date().toISOString(),
  version: task.version + 1,
  syncState: "pending" as const,
});

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => {
      const persistTaskAsync = async (nextTask: Task) => {
        try {
          await tasksRepository.upsertTaskAsync(nextTask);
        } catch {
          set((state) => ({
            ...upsertTaskState(state, {
              ...nextTask,
              syncState: "failed",
            }),
          }));
        }
      };

      return {
        hydrated: false,
        tasksById: {},
        taskIds: [],
        pendingDeletesById: {},
        setHydrated: (hydrated) => set({ hydrated }),
        replaceAllFromRemote: (tasks, options) =>
          set((state) => {
            const targetUserId =
              options?.userId ??
              tasks[0]?.userId ??
              useSessionStore.getState().userId;

            if (!targetUserId) {
              return state;
            }

            const otherUsersTasks = Object.fromEntries(
              Object.entries(state.tasksById).filter(
                ([, task]) => task.userId !== targetUserId,
              ),
            );
            const currentUserTasks = Object.fromEntries(
              Object.entries(state.tasksById).filter(
                ([, task]) => task.userId === targetUserId,
              ),
            );
            const otherUsersPendingDeletes = Object.fromEntries(
              Object.entries(state.pendingDeletesById).filter(
                ([, task]) => task.userId !== targetUserId,
              ),
            );
            const currentUserPendingDeletes = Object.fromEntries(
              Object.entries(state.pendingDeletesById).filter(
                ([, task]) => task.userId === targetUserId,
              ),
            );
            const nextUserTasksById: Record<string, Task> = {};

            for (const remoteTask of tasks) {
              if (currentUserPendingDeletes[remoteTask.id]) {
                continue;
              }

              const existing = currentUserTasks[remoteTask.id];

              if (!existing) {
                nextUserTasksById[remoteTask.id] = remoteTask;
                continue;
              }

              if (shouldPreferLocalTask(existing, remoteTask)) {
                nextUserTasksById[remoteTask.id] = {
                  ...existing,
                  attachments: mergeAttachments(
                    existing.attachments,
                    remoteTask.attachments,
                  ),
                };
                continue;
              }

              nextUserTasksById[remoteTask.id] = {
                ...remoteTask,
                attachments: mergeAttachments(
                  existing.attachments,
                  remoteTask.attachments,
                ),
              };
            }

            for (const localTask of Object.values(currentUserTasks)) {
              if (
                nextUserTasksById[localTask.id] ||
                currentUserPendingDeletes[localTask.id]
              ) {
                continue;
              }

              if (options?.preserveLocalSynced || isUnsyncedTask(localTask)) {
                nextUserTasksById[localTask.id] = localTask;
              }
            }

            const tasksById = {
              ...otherUsersTasks,
              ...nextUserTasksById,
            };

            return {
              tasksById,
              taskIds: sortTaskIds(sortTasks(tasksById)),
              pendingDeletesById: {
                ...otherUsersPendingDeletes,
                ...currentUserPendingDeletes,
              },
            };
          }),
        retryUnsyncedTasksAsync: async (userId) => {
          const { tasksById, pendingDeletesById } = get();
          const unsyncedTasks = Object.values(tasksById).filter(
            (task) => task.userId === userId && task.syncState !== "synced",
          );
          const pendingDeletes = Object.values(pendingDeletesById).filter(
            (task) => task.userId === userId,
          );

          await Promise.all(
            unsyncedTasks.map(async (task) => {
              const nextTask = {
                ...task,
                syncState: "pending" as const,
              };

              set((state) => ({
                ...upsertTaskState(state, nextTask),
              }));

              await persistTaskAsync(nextTask);
            }),
          );

          await Promise.all(
            pendingDeletes.map(async (task) => {
              set((state) => ({
                pendingDeletesById: {
                  ...state.pendingDeletesById,
                  [task.id]: {
                    ...task,
                    syncState: "pending",
                  },
                },
              }));

              try {
                await tasksRepository.deleteTaskAsync(task.userId, task.id);
                set((state) => {
                  const nextPendingDeletes = { ...state.pendingDeletesById };
                  delete nextPendingDeletes[task.id];

                  return {
                    pendingDeletesById: nextPendingDeletes,
                  };
                });
              } catch {
                set((state) => ({
                  pendingDeletesById: {
                    ...state.pendingDeletesById,
                    [task.id]: {
                      ...task,
                      syncState: "failed",
                    },
                  },
                }));
              }
            }),
          );

          return {
            upserts: unsyncedTasks.length,
            deletes: pendingDeletes.length,
          };
        },
        clearAll: () =>
          set({
            tasksById: {},
            taskIds: [],
            pendingDeletesById: {},
          }),
        createTask: (input) => {
          const userId = useSessionStore.getState().userId;

          if (!userId) {
            return "";
          }

          const taskId = createId("task");
          const now = new Date().toISOString();
          const nextTask: Task = {
            id: taskId,
            userId,
            title: input.title,
            description: input.description,
            status: input.status ?? "pending",
            priority: input.priority ?? "medium",
            tags: input.tags ?? [],
            checklist: [],
            attachments: [],
            timeline: [
              {
                id: createId("timeline"),
                type: "created",
                message: "Task created.",
                createdAt: now,
              },
            ],
            createdAt: now,
            updatedAt: now,
            version: 1,
            syncState: "pending",
          };

          set((state) => ({
            ...upsertTaskState(state, nextTask, { prepend: true }),
          }));
          void persistTaskAsync(nextTask);
          return taskId;
        },
        createTaskFromVoiceTranscript: (transcript) => {
          const cleaned = transcript.trim();
          const title = cleaned.split(/[.!?]/)[0]?.slice(0, 72) || "Voice note";
          return get().createTask({
            title,
            description: cleaned,
            tags: ["Voice"],
            priority: "medium",
          });
        },
        updateTask: (taskId, patch) => {
          const task = get().tasksById[taskId];

          if (!task) {
            return;
          }

          const nextTask = withTimelineUpdate(
            {
              ...task,
              ...patch,
            },
            "Task details updated.",
            "edited",
          );

          set((state) => ({
            ...upsertTaskState(state, nextTask),
          }));
          void persistTaskAsync(nextTask);
        },
        toggleChecklistItem: (taskId, itemId) => {
          const task = get().tasksById[taskId];

          if (!task) {
            return;
          }

          const nextTask = withTimelineUpdate(
            {
              ...task,
              checklist: task.checklist.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      completed: !item.completed,
                    }
                  : item,
              ),
            },
            "Checklist updated.",
            "edited",
          );

          set((state) => ({
            ...upsertTaskState(state, nextTask),
          }));
          void persistTaskAsync(nextTask);
        },
        addChecklistItem: (taskId, label) => {
          const task = get().tasksById[taskId];

          if (!task || !label.trim()) {
            return;
          }

          const nextTask = withTimelineUpdate(
            {
              ...task,
              checklist: [
                ...task.checklist,
                {
                  id: createId("check"),
                  label: label.trim(),
                  completed: false,
                },
              ],
            },
            "Checklist item added.",
            "edited",
          );

          set((state) => ({
            ...upsertTaskState(state, nextTask),
          }));
          void persistTaskAsync(nextTask);
        },
        addAttachment: (taskId, attachment) => {
          const task = get().tasksById[taskId];

          if (!task || !attachment.localUri) {
            return;
          }

          const nextTask = withTimelineUpdate(
            {
              ...task,
              attachments: [attachment, ...task.attachments],
            },
            `${attachment.name} stored on this device.`,
            "attachment_added",
          );

          set((state) => ({
            ...upsertTaskState(state, nextTask),
          }));
          void persistTaskAsync(nextTask);
        },
        appendVoiceTranscript: (taskId, transcript) => {
          const task = get().tasksById[taskId];

          if (!task || !transcript.trim()) {
            return;
          }

          const nextTask = withTimelineUpdate(
            {
              ...task,
              description: task.description
                ? `${task.description}\n\n${transcript.trim()}`
                : transcript.trim(),
              tags: task.tags.includes("Voice")
                ? task.tags
                : [...task.tags, "Voice"],
            },
            "Voice transcript appended to the task.",
            "voice_capture",
          );

          set((state) => ({
            ...upsertTaskState(state, nextTask),
          }));
          void persistTaskAsync(nextTask);
        },
        pruneMissingAttachmentsAsync: async () => {
          const updates = await Promise.all(
            Object.entries(get().tasksById).map(async ([taskId, task]) => {
              let changed = false;
              const checked = await Promise.all(
                task.attachments.map(async (attachment) => {
                  if (!attachment.localUri) {
                    return attachment;
                  }

                  const exists = await fileService.attachmentExistsAsync(attachment.localUri);

                  if (!exists) {
                    changed = true;
                    return null;
                  }

                  if (attachment.syncState !== "local_only") {
                    changed = true;
                  }

                  return exists
                    ? {
                        ...attachment,
                        syncState: "local_only" as const,
                      }
                    : null;
                }),
              );

              const attachments = checked.filter(
                (attachment): attachment is TaskAttachment => Boolean(attachment),
              );

              if (!changed) {
                return null;
              }

              return [
                taskId,
                {
                  ...task,
                  attachments,
                },
              ] as const;
            }),
          );

          const nextEntries = updates.filter(
            (
              entry,
            ): entry is readonly [string, Task] => Boolean(entry),
          );

          if (!nextEntries.length) {
            return;
          }

          set((state) => {
            const tasksById = { ...state.tasksById };

            for (const [taskId, task] of nextEntries) {
              tasksById[taskId] = task;
            }

            return {
              tasksById,
              taskIds: state.taskIds,
            };
          });
        },
        deleteTask: async (taskId) => {
          const task = get().tasksById[taskId];

          if (!task) {
            return;
          }

          set((state) => {
            return {
              ...removeTaskFromState(state, taskId),
              pendingDeletesById: {
                ...state.pendingDeletesById,
                [taskId]: {
                  ...task,
                  syncState: "pending",
                },
              },
            };
          });

          try {
            await tasksRepository.deleteTaskAsync(task.userId, taskId);
            set((state) => {
              const nextPendingDeletes = { ...state.pendingDeletesById };
              delete nextPendingDeletes[taskId];

              return {
                pendingDeletesById: nextPendingDeletes,
              };
            });
          } catch {
            set((state) => ({
              pendingDeletesById: {
                ...state.pendingDeletesById,
                [taskId]: {
                  ...task,
                  syncState: "failed",
                },
              },
            }));
          }
        },
        markCompleted: async (taskId) => {
          const task = get().tasksById[taskId];

          if (!task || task.status === "completed") {
            return;
          }

          const nextTask = withTimelineUpdate(
            {
              ...task,
              status: "completed",
            },
            "Task marked completed.",
            "status_changed",
          );

          set((state) => ({
            ...upsertTaskState(state, nextTask),
          }));
          await persistTaskAsync(nextTask);
        },
      };
    },
    {
      name: "tasks-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        tasksById: state.tasksById,
        taskIds: state.taskIds,
        pendingDeletesById: state.pendingDeletesById,
      }),
    },
  ),
);
