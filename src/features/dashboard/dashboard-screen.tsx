import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Archive,
  CheckCircle2,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { SearchInput } from "@/components/search-input";
import { SectionHeader } from "@/components/section-header";
import { SkeletonBlock } from "@/components/skeleton-block";
import { VoiceFab } from "@/components/voice-fab";
import { InsightTile } from "@/features/dashboard/components/insight-tile";
import { VoiceCaptureSheet } from "@/features/voice/components/voice-capture-sheet";
import { APP_CONFIG, APP_LIMITS } from "@/constants/app";
import { useSessionStore } from "@/store/session-store";
import { useTasksStore } from "@/store/tasks-store";
import { useVaultStore } from "@/store/vault-store";
import type { AppTabParamList, HomeStackParamList } from "@/types/navigation";
import { formatRelativeTime } from "@/utils/date";

type DashboardNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "Home">,
  BottomTabNavigationProp<AppTabParamList>
>;

export const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const userId = useSessionStore((state) => state.userId);
  const vaultUnlocked = useSessionStore((state) => state.vaultUnlocked);
  const taskIds = useTasksStore((state) => state.taskIds);
  const tasksById = useTasksStore((state) => state.tasksById);
  const createTaskFromVoiceTranscript = useTasksStore(
    (state) => state.createTaskFromVoiceTranscript,
  );
  const vaultItemIds = useVaultStore((state) => state.itemIds);
  const vaultItemsById = useVaultStore((state) => state.itemsById);
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(true);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeletons(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const tasks = useMemo(
    () =>
      taskIds
        .map((id) => tasksById[id])
        .filter((task) => Boolean(task) && task.userId === userId),
    [taskIds, tasksById, userId],
  );
  const vaultItems = useMemo(
    () =>
      vaultItemIds
        .map((id) => vaultItemsById[id])
        .filter((item) => Boolean(item) && item.userId === userId),
    [userId, vaultItemIds, vaultItemsById],
  );

  const filteredRecentTasks = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const recentTasks = [...tasks]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, APP_LIMITS.dashboardRecentItems);

    if (!normalizedQuery) {
      return recentTasks;
    }

    return recentTasks.filter((task) =>
      `${task.title} ${task.description} ${task.tags.join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [deferredSearchQuery, tasks]);

  const filteredRecentVaultItems = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const recentVaultItems = [...vaultItems]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, APP_LIMITS.dashboardRecentItems);

    if (!normalizedQuery) {
      return recentVaultItems;
    }

    return recentVaultItems.filter((item) =>
      `${item.title} ${item.category} ${item.notes ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [deferredSearchQuery, vaultItems]);

  const stats = useMemo(() => {
    const pendingTasks = tasks.filter((task) => task.status !== "completed").length;
    const completedTasks = tasks.filter((task) => task.status === "completed").length;
    const sensitiveEntries = vaultItems.length;
    const focusedItems = tasks.filter((task) => task.priority === "high").length;

    return [
      {
        id: "focused",
        label: "Focus items",
        value: `${focusedItems}`,
        helper: "High priority work",
        tone: "accent" as const,
        icon: Sparkles,
      },
      {
        id: "open",
        label: "Open tasks",
        value: `${pendingTasks}`,
        helper: "Need action today",
        tone: "warning" as const,
        icon: SearchCheck,
      },
      {
        id: "done",
        label: "Completed",
        value: `${completedTasks}`,
        helper: "Recently cleared",
        tone: "success" as const,
        icon: CheckCircle2,
      },
      {
        id: "vault",
        label: "Vault entries",
        value: `${sensitiveEntries}`,
        helper: "Protected locally",
        tone: "vault" as const,
        icon: ShieldCheck,
      },
    ];
  }, [tasks, vaultItems.length]);

  const handleVoiceApply = (transcript: string) => {
    createTaskFromVoiceTranscript(transcript);
    Alert.alert(
      "Voice note captured",
      "A new task was created from your transcript. You can refine it from the Tasks screen.",
    );
  };

  const handleOpenTask = (taskId: string) => {
    navigation.navigate("TasksTab", {
      screen: "TaskDetail",
      params: { taskId },
    });
  };

  const handleOpenVault = (itemId?: string) => {
    if (vaultUnlocked && itemId) {
      navigation.navigate("VaultTab", {
        screen: "VaultEditor",
        params: { itemId },
      });
      return;
    }

    navigation.navigate("VaultTab", {
      screen: "Vault",
    });
  };

  return (
    <Screen scrollable={false} contentClassName="gap-0 px-0 pb-0 pt-0">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-40 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <Card className="overflow-hidden bg-surface-elevated px-5 py-6">
          <View className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-accent/10" />
          <View className="absolute -bottom-12 right-10 h-24 w-24 rounded-full bg-vault/10" />
          <View className="gap-4">
            <View className="gap-2">
              <AppText variant="label" tone="accent">
                {APP_CONFIG.appName}
              </AppText>
              <AppText variant="hero">Move fast, keep your private context tighter.</AppText>
              <AppText tone="secondary">
                One calm workspace for active ideas, secure credentials, and voice-powered capture.
              </AppText>
            </View>
            <View className="flex-row gap-3">
              <AppButton
                label="Voice capture"
                onPress={() => setVoiceOpen(true)}
                icon={Sparkles}
                className="flex-1"
              />
              <AppButton
                label="Vault ready"
                onPress={() => handleOpenVault()}
                variant="secondary"
                icon={ShieldCheck}
                className="flex-1"
              />
            </View>
          </View>
        </Card>

        <SearchInput
          placeholder="Search recent tasks and secure notes"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View className="flex-row flex-wrap gap-4">
          {showSkeletons
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="min-w-[47%] flex-1 gap-4 px-4 py-4">
                  <SkeletonBlock className="h-10 w-10 rounded-2xl" />
                  <View className="gap-2">
                    <SkeletonBlock className="h-3 w-20" />
                    <SkeletonBlock className="h-8 w-16" />
                    <SkeletonBlock className="h-3 w-24" />
                  </View>
                </Card>
              ))
            : stats.map((stat) => <InsightTile key={stat.id} {...stat} />)}
        </View>

        <SectionHeader
          eyebrow="Recent work"
          title="Tasks in motion"
          description="The latest ideas and execution threads across your week."
        />
        <View className="gap-4">
          {filteredRecentTasks.map((task) => (
            <Pressable key={task.id} onPress={() => handleOpenTask(task.id)}>
              <Card className="gap-2 px-4 py-4 active:opacity-95">
                <View className="flex-row items-center justify-between gap-3">
                  <AppText variant="subtitle" className="flex-1">
                    {task.title}
                  </AppText>
                  <AppText variant="caption" tone="secondary">
                    {formatRelativeTime(task.updatedAt)}
                  </AppText>
                </View>
                <AppText tone="secondary" numberOfLines={2}>
                  {task.description}
                </AppText>
              </Card>
            </Pressable>
          ))}
        </View>

        <SectionHeader
          eyebrow="Protected context"
          title="Vault snapshot"
          description="Firestore restores metadata quickly, while secret values remain on this device."
        />
        <View className="gap-4">
          {filteredRecentVaultItems.map((item) => (
            <Pressable key={item.id} onPress={() => handleOpenVault(item.id)}>
              <Card className="gap-3 px-4 py-4 active:opacity-95">
                <View className="flex-row items-center justify-between gap-4">
                  <View className="flex-1 gap-1">
                    <AppText variant="subtitle">{item.title}</AppText>
                    <AppText variant="caption" tone="secondary">
                      {item.category.replace("_", " ")}
                    </AppText>
                  </View>
                  <Archive color="#0F766E" size={18} strokeWidth={2.2} />
                </View>
                <AppText tone="secondary" numberOfLines={2}>
                  {item.notes ?? "Local secure storage entry"}
                </AppText>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <VoiceFab onPress={() => setVoiceOpen(true)} />
      <VoiceCaptureSheet
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onApply={handleVoiceApply}
      />
    </Screen>
  );
};
