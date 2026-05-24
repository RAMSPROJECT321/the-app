import { apiClient } from "@/api/client";
import { mapTaskToTaskRow } from "@/api/mappers/task.mapper";
import type { ApiEnvelope, TaskRowDto } from "@/types/api";
import type { Task } from "@/types/entities";

export const listTasks = (envelope: ApiEnvelope<Record<string, never>>) =>
  apiClient.post<Record<string, never>, TaskRowDto[]>("tasks/list", envelope);

export const upsertTask = (envelope: ApiEnvelope<{ task: Task }>) =>
  apiClient.post<{ task: TaskRowDto }, { id: string }>("tasks/upsert", {
    ...envelope,
    payload: {
      task: mapTaskToTaskRow(envelope.payload.task),
    },
  });

export const deleteTask = (envelope: ApiEnvelope<{ id: string }>) =>
  apiClient.post<{ id: string }, { id: string }>("tasks/delete", envelope);
