import type { TaskRowDto } from "@/types/api";
import type { Task } from "@/types/entities";

const parseJsonArray = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const mapTaskRowToTask = (row: TaskRowDto): Task => ({
  id: row.id,
  userId: row.userId,
  title: row.title,
  description: row.description,
  status: row.status as Task["status"],
  priority: row.priority as Task["priority"],
  tags: parseJsonArray<string[]>(row.tags, []),
  checklist: parseJsonArray<Task["checklist"]>(row.checklist, []),
  attachments: parseJsonArray<Task["attachments"]>(row.attachments, []),
  timeline: parseJsonArray<Task["timeline"]>(row.timeline, []),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  version: row.version,
  syncState: "synced",
});

export const mapTaskToTaskRow = (task: Task): TaskRowDto => ({
  id: task.id,
  userId: task.userId,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  tags: JSON.stringify(task.tags),
  checklist: JSON.stringify(task.checklist),
  attachments: JSON.stringify(task.attachments),
  timeline: JSON.stringify(task.timeline),
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
  version: task.version,
});
