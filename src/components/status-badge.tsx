import { AppText } from "@/components/app-text";
import type { TaskStatus } from "@/types/entities";
import { cn } from "@/utils/cn";

const statusClassMap: Record<TaskStatus, string> = {
  pending: "bg-warning/10 text-warning",
  in_progress: "bg-accent-soft text-accent",
  completed: "bg-success/10 text-success",
};

const statusLabelMap: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export const StatusBadge = ({ status }: { status: TaskStatus }) => (
  <AppText
    variant="caption"
    className={cn("self-start rounded-full px-3 py-1.5", statusClassMap[status])}
  >
    {statusLabelMap[status]}
  </AppText>
);
