import { Plus, SlidersHorizontal, Sparkles } from "lucide-react-native";
import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { ListItemSeparator } from "@/components/list-item-separator";
import { Screen } from "@/components/screen";
import { SearchInput } from "@/components/search-input";
import { SectionHeader } from "@/components/section-header";
import { TextField } from "@/components/text-field";
import { TaskCard } from "@/features/tasks/components/task-card";
import { VoiceCaptureSheet } from "@/features/voice/components/voice-capture-sheet";
import { useAppTheme } from "@/hooks/use-app-theme";
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
  const { palette } = useAppTheme();
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
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    priorityFilter !== "all";

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

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
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
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="gap-5 pb-6 pt-2">
            <SectionHeader
              eyebrow="Ideas and execution"
              title="Task tracker"
              description="Capture quickly, filter hard, and keep the list moving."
            />

            <SearchInput
              placeholder="Search titles, notes, and tags"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <Card className="gap-4 overflow-hidden px-4 py-4">
              <View className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-accent/10" />
              <View className="gap-1">
                <AppText variant="subtitle">Quick capture</AppText>
                <AppText variant="caption" tone="secondary">
                  Start with a title, or speak and turn it straight into a task.
                </AppText>
              </View>
              <TextField
                label="Task title"
                value={quickTitle}
                onChangeText={setQuickTitle}
                placeholder="Write the next thing you need to ship"
              />
              <View className="flex-row gap-3">
                <AppButton
                  label="Add task"
                  onPress={handleQuickAdd}
                  icon={Plus}
                  className="flex-1"
                />
                <AppButton
                  label="Voice"
                  onPress={() => setVoiceOpen(true)}
                  icon={Sparkles}
                  variant="secondary"
                  className="flex-1"
                />
              </View>
            </Card>

            <Card className="gap-4 px-4 py-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-2">
                  <SlidersHorizontal color={palette.textSecondary} size={16} strokeWidth={2.2} />
                  <AppText variant="subtitle">Filters</AppText>
                </View>
                {hasActiveFilters ? (
                  <Pressable onPress={handleResetFilters}>
                    <AppText variant="caption" tone="accent">
                      Clear all
                    </AppText>
                  </Pressable>
                ) : null}
              </View>

              <View className="gap-2">
                <AppText variant="caption" tone="secondary">
                  Status
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2 pr-3"
                >
                  {statusFilters.map((filter) => (
                    <Chip
                      key={filter}
                      label={filter.replace("_", " ")}
                      selected={statusFilter === filter}
                      onPress={() => setStatusFilter(filter)}
                    />
                  ))}
                </ScrollView>
              </View>

              <View className="gap-2">
                <AppText variant="caption" tone="secondary">
                  Priority
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2 pr-3"
                >
                  {priorityFilters.map((filter) => (
                    <Chip
                      key={filter}
                      label={filter}
                      selected={priorityFilter === filter}
                      onPress={() => setPriorityFilter(filter)}
                    />
                  ))}
                </ScrollView>
              </View>
            </Card>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={Sparkles}
            title="Nothing matches those filters"
            description="Try another search, or capture a new idea before it disappears."
            actionLabel="Clear search"
            onActionPress={handleResetFilters}
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
