import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { buildDemoTasks } from "@/features/tasks/data/demo-tasks";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import type { Task, TaskAttachment, TaskPriority, TaskStatus } from "@/types/entities";
import type { SyncQueueItem } from "@/types/sync";
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
  seededDemoData: boolean;
  tasksById: Record<string, Task>;
  taskIds: string[];
  setHydrated: (hydrated: boolean) => void;
  seedDemoDataIfEmpty: () => void;
  replaceAllFromRemote: (tasks: Task[]) => void;
  createTask: (input: CreateTaskInput) => string;
  createTaskFromVoiceTranscript: (transcript: string) => string;
  updateTask: (taskId: string, patch: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "tags">>) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  addChecklistItem: (taskId: string, label: string) => void;
  addAttachment: (taskId: string, attachment: TaskAttachment) => void;
  appendVoiceTranscript: (taskId: string, transcript: string) => void;
  deleteTask: (taskId: string) => void;
  markCompleted: (taskId: string) => void;
}

const enqueueTaskMutation = (entityId: string, operation: SyncQueueItem["operation"]) => {
  useSyncStore.getState().enqueue({
    id: createId("sync"),
    entityId,
    entityType: "task",
    operation,
    updatedAt: new Date().toISOString(),
    attemptCount: 0,
  });
};

const upsertTaskState = (
  state: TasksState,
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

const withTimelineUpdate = (task: Task, message: string, type: Task["timeline"][number]["type"]) => ({
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
    (set, get) => ({
      hydrated: false,
      seededDemoData: false,
      tasksById: {},
      taskIds: [],
      setHydrated: (hydrated) => set({ hydrated }),
      seedDemoDataIfEmpty: () => {
        if (get().seededDemoData || get().taskIds.length > 0) {
          return;
        }

        const userId = useSessionStore.getState().userId;
        const demoTasks = buildDemoTasks(userId);
        set({
          seededDemoData: true,
          tasksById: Object.fromEntries(demoTasks.map((task) => [task.id, task])),
          taskIds: demoTasks.map((task) => task.id),
        });
      },
      replaceAllFromRemote: (tasks) =>
        set({
          seededDemoData: false,
          tasksById: Object.fromEntries(tasks.map((task) => [task.id, task])),
          taskIds: tasks
            .slice()
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
            .map((task) => task.id),
        }),
      createTask: (input) => {
        const userId = useSessionStore.getState().userId;
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
              message: "Task created locally.",
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
        enqueueTaskMutation(taskId, "upsert");
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
        enqueueTaskMutation(taskId, "upsert");
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
        enqueueTaskMutation(taskId, "upsert");
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
        enqueueTaskMutation(taskId, "upsert");
      },
      addAttachment: (taskId, attachment) => {
        const task = get().tasksById[taskId];

        if (!task) {
          return;
        }

        const nextTask = withTimelineUpdate(
          {
            ...task,
            attachments: [attachment, ...task.attachments],
          },
          `${attachment.name} saved as a local attachment.`,
          "attachment_added",
        );

        set((state) => ({
          ...upsertTaskState(state, nextTask),
        }));
        enqueueTaskMutation(taskId, "upsert");
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
            tags: task.tags.includes("Voice") ? task.tags : [...task.tags, "Voice"],
          },
          "Voice transcript appended to the description.",
          "voice_capture",
        );

        set((state) => ({
          ...upsertTaskState(state, nextTask),
        }));
        enqueueTaskMutation(taskId, "upsert");
      },
      deleteTask: (taskId) => {
        set((state) => {
          const nextTasks = { ...state.tasksById };
          delete nextTasks[taskId];

          return {
            tasksById: nextTasks,
            taskIds: state.taskIds.filter((id) => id !== taskId),
          };
        });
        enqueueTaskMutation(taskId, "delete");
      },
      markCompleted: (taskId) => {
        const task = get().tasksById[taskId];

        if (!task || task.status === "completed") {
          return;
        }

        const nextTask = withTimelineUpdate(
          {
            ...task,
            status: "completed",
          },
          "Task marked as completed.",
          "status_changed",
        );

        set((state) => ({
          ...upsertTaskState(state, nextTask),
        }));
        enqueueTaskMutation(taskId, "upsert");
      },
    }),
    {
      name: "tasks-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
