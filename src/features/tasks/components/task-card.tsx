import { Clock3, Trash2 } from "lucide-react-native";
import { memo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Task } from "@/types/entities";
import { formatRelativeTime } from "@/utils/date";

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

const priorityToneMap = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-danger/10 text-danger",
} as const;

export const TaskCard = memo(
  ({ task, onPress, onComplete, onDelete }: TaskCardProps) => {
    const { palette } = useAppTheme();
    const swipeableRef = useRef<Swipeable>(null);
    const [activeAction, setActiveAction] = useState<"complete" | "delete" | null>(null);
    const completedChecklist = task.checklist.filter((item) => item.completed).length;
    const showCompleteAction = task.status !== "completed";

    const handleSwipeAction = async (
      action: "complete" | "delete",
      callback: TaskCardProps["onComplete"] | TaskCardProps["onDelete"],
    ) => {
      if (activeAction) {
        return;
      }

      setActiveAction(action);

      try {
        await callback();
      } finally {
        swipeableRef.current?.close();
        setActiveAction(null);
      }
    };

    return (
      <Swipeable
        ref={swipeableRef}
        overshootRight={false}
        renderRightActions={() => (
          <View className="flex-row items-stretch gap-3 pl-3">
            {showCompleteAction ? (
              <Pressable
                className="w-20 items-center justify-center rounded-3xl bg-success"
                disabled={Boolean(activeAction)}
                onPress={() => void handleSwipeAction("complete", onComplete)}
              >
                {activeAction === "complete" ? (
                  <ActivityIndicator color={palette.textInverse} />
                ) : (
                  <AppText variant="caption" tone="inverse">
                    Done
                  </AppText>
                )}
              </Pressable>
            ) : null}
            <Pressable
              className="w-20 items-center justify-center rounded-3xl bg-danger"
              disabled={Boolean(activeAction)}
              onPress={() => void handleSwipeAction("delete", onDelete)}
            >
              {activeAction === "delete" ? (
                <ActivityIndicator color={palette.textInverse} />
              ) : (
                <Trash2 color={palette.textInverse} size={18} strokeWidth={2.2} />
              )}
            </Pressable>
          </View>
        )}
      >
        <Pressable onPress={onPress}>
          <Card className="gap-4 px-5 py-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1 gap-2">
                <StatusBadge status={task.status} />
                <AppText variant="subtitle">{task.title}</AppText>
                <AppText tone="secondary" numberOfLines={2}>
                  {task.description}
                </AppText>
              </View>
              <AppText
                variant="caption"
                className={`rounded-full px-3 py-1.5 ${priorityToneMap[task.priority]}`}
              >
                {task.priority}
              </AppText>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {task.tags.map((tag) => (
                <AppText
                  key={tag}
                  variant="caption"
                  className="rounded-full bg-background-muted px-3 py-1.5 text-text-secondary"
                >
                  {tag}
                </AppText>
              ))}
            </View>

            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-row items-center gap-2">
                <Clock3 color={palette.textSecondary} size={14} strokeWidth={2.1} />
                <AppText variant="caption" tone="secondary">
                  Updated {formatRelativeTime(task.updatedAt)}
                </AppText>
              </View>
              <AppText variant="caption" tone="tertiary">
                {completedChecklist}/{task.checklist.length} checklist
              </AppText>
            </View>
          </Card>
        </Pressable>
      </Swipeable>
    );
  },
);

TaskCard.displayName = "TaskCard";
