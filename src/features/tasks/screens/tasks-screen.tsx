import { Plus, Sparkles } from "lucide-react-native";
import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { ListItemSeparator } from "@/components/list-item-separator";
import { Screen } from "@/components/screen";
import { SearchInput } from "@/components/search-input";
import { SectionHeader } from "@/components/section-header";
import { TaskCard } from "@/features/tasks/components/task-card";
import { VoiceCaptureSheet } from "@/features/voice/components/voice-capture-sheet";
import { useSessionStore } from "@/store/session-store";
import { useTasksStore } from "@/store/tasks-store";
import type { Task, TaskPriority, TaskStatus } from "@/types/entities";
import type { TasksStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<TasksStackParamList, "Tasks">;

const statusFilters: Array<"all" | TaskStatus> = [
  "all",
  "pending",
  "in_progress",
  "completed",
];
const priorityFilters: Array<"all" | TaskPriority> = [
  "all",
  "high",
  "medium",
  "low",
];

const TaskListItem = memo(TaskCard);

export const TasksScreen = ({ navigation }: Props) => {
  const userId = useSessionStore((state) => state.userId);
  const taskIds = useTasksStore((state) => state.taskIds);
  const tasksById = useTasksStore((state) => state.tasksById);
  const createTask = useTasksStore((state) => state.createTask);
  const createTaskFromVoiceTranscript = useTasksStore(
    (state) => state.createTaskFromVoiceTranscript,
  );
  const markCompleted = useTasksStore((state) => state.markCompleted);
  const deleteTask = useTasksStore((state) => state.deleteTask);
  const [quickTitle, setQuickTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const tasks = useMemo(
    () =>
      taskIds
        .map((id) => tasksById[id])
        .filter((task) => Boolean(task) && task.userId === userId),
    [taskIds, tasksById, userId],
  );

  const filteredTasks = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return [...tasks]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .filter((task) => {
        const matchesQuery = normalizedQuery
          ? `${task.title} ${task.description} ${task.tags.join(" ")}`
              .toLowerCase()
              .includes(normalizedQuery)
          : true;
        const matchesStatus = statusFilter === "all" ? true : task.status === statusFilter;
        const matchesPriority =
          priorityFilter === "all" ? true : task.priority === priorityFilter;

        return matchesQuery && matchesStatus && matchesPriority;
      });
  }, [deferredSearchQuery, priorityFilter, statusFilter, tasks]);

  const handleQuickAdd = () => {
    const trimmedTitle = quickTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    const taskId = createTask({
      title: trimmedTitle,
      description: "Created from the quick capture field.",
      tags: ["Quick Add"],
      priority: "medium",
    });

    setQuickTitle("");
    navigation.navigate("TaskDetail", { taskId });
  };

  const handleVoiceApply = (transcript: string) => {
    const taskId = createTaskFromVoiceTranscript(transcript);
    navigation.navigate("TaskDetail", { taskId });
  };

  const renderTaskItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskListItem
        task={item}
        onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
        onComplete={async () => {
          await markCompleted(item.id);
        }}
        onDelete={async () => {
          await deleteTask(item.id);
        }}
      />
    ),
    [deleteTask, markCompleted, navigation],
  );

  return (
    <Screen scrollable={false} contentClassName="gap-0 px-0 pb-0 pt-0">
      <View className="gap-5 px-5 pb-4 pt-2">
        <SectionHeader
          eyebrow="Ideas and execution"
          title="Task tracker"
          description="Capture quickly, filter hard, and keep the list moving."
        />

        <View className="gap-4 rounded-[28px] border border-border bg-surface px-4 py-4">
          <SearchInput
            placeholder="Search titles, notes, and tags"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-3xl border border-border bg-surface-elevated px-4 py-3">
              <AppText variant="caption" tone="secondary">
                Quick add
              </AppText>
              <View className="mt-2 flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <SearchInput
                    placeholder="Write the task title"
                    value={quickTitle}
                    onChangeText={setQuickTitle}
                    className="min-h-11 border-0 bg-transparent px-0"
                  />
                </View>
                <AppButton
                  label="Add"
                  onPress={handleQuickAdd}
                  icon={Plus}
                  className="min-h-11 px-4"
                />
              </View>
            </View>
            <AppButton
              label="Voice"
              onPress={() => setVoiceOpen(true)}
              icon={Sparkles}
              variant="secondary"
              className="self-end"
            />
          </View>
        </View>

        <View className="gap-3">
          <AppText variant="caption" tone="secondary">
            Status
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Chip
                key={filter}
                label={filter.replace("_", " ")}
                selected={statusFilter === filter}
                onPress={() => setStatusFilter(filter)}
              />
            ))}
          </View>
        </View>

        <View className="gap-3">
          <AppText variant="caption" tone="secondary">
            Priority
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {priorityFilters.map((filter) => (
              <Chip
                key={filter}
                label={filter}
                selected={priorityFilter === filter}
                onPress={() => setPriorityFilter(filter)}
              />
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListItemSeparator}
        contentContainerClassName="px-5 pb-40"
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            icon={Sparkles}
            title="Nothing matches those filters"
            description="Try another search, or capture a new idea before it disappears."
            actionLabel="Clear search"
            onActionPress={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
          />
        }
      />

      <VoiceCaptureSheet
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onApply={handleVoiceApply}
      />
    </Screen>
  );
};
