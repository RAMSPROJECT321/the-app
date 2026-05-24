import { Check, ImagePlus, Plus, Sparkles } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { APP_MESSAGES } from "@/constants/app";
import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { TextField } from "@/components/text-field";
import { VoiceCaptureSheet } from "@/features/voice/components/voice-capture-sheet";
import { fileService } from "@/services/files/file.service";
import { useSessionStore } from "@/store/session-store";
import { useTasksStore } from "@/store/tasks-store";
import type { TaskPriority, TaskStatus } from "@/types/entities";
import type { TasksStackParamList } from "@/types/navigation";
import { formatDateTime } from "@/utils/date";
import { createId } from "@/utils/id";

type Props = NativeStackScreenProps<TasksStackParamList, "TaskDetail">;

const statuses: TaskStatus[] = ["pending", "in_progress", "completed"];
const priorities: TaskPriority[] = ["low", "medium", "high"];

export const TaskDetailScreen = ({ route }: Props) => {
  const { taskId } = route.params;
  const userId = useSessionStore((state) => state.userId);
  const task = useTasksStore((state) => {
    const nextTask = state.tasksById[taskId];
    return nextTask?.userId === userId ? nextTask : undefined;
  });
  const updateTask = useTasksStore((state) => state.updateTask);
  const toggleChecklistItem = useTasksStore((state) => state.toggleChecklistItem);
  const addChecklistItem = useTasksStore((state) => state.addChecklistItem);
  const addAttachment = useTasksStore((state) => state.addAttachment);
  const appendVoiceTranscript = useTasksStore((state) => state.appendVoiceTranscript);
  const markCompleted = useTasksStore((state) => state.markCompleted);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "pending");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [tagsText, setTagsText] = useState(task?.tags.join(", ") ?? "");
  const [checklistInput, setChecklistInput] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);

  useEffect(() => {
    if (!task) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setTagsText(task.tags.join(", "));
  }, [task]);

  const parsedTags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsText],
  );

  if (!task) {
    return (
      <Screen>
        <EmptyState
          icon={Sparkles}
          title="Task not found"
          description="This task may have been removed before the detail screen opened."
        />
      </Screen>
    );
  }

  const handleSave = () => {
    updateTask(taskId, {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      tags: parsedTags,
    });
  };

  const handleAttachment = () => {
    void (async () => {
      const file = await fileService.pickImageAttachmentAsync();

      if (!file) {
        return;
      }

        addAttachment(taskId, {
          id: createId("attachment"),
          ...file,
          createdAt: new Date().toISOString(),
          syncState: "local_only",
        });
      Alert.alert("Attachment saved", APP_MESSAGES.attachmentQueued);
    })();
  };

  return (
    <Screen scrollable={false} contentClassName="pb-0">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-28 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          eyebrow="Idea detail"
          title={task.title}
          description="Edit the working details, attachments, and history without leaving the flow."
        />

        <Card className="gap-4">
          <TextField label="Title" value={title} onChangeText={setTitle} />
          <TextField
            label="Description"
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TextField
            label="Tags"
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="Growth, Voice, Security"
            hint="Separate tags with commas."
          />

          <View className="gap-3">
            <AppText variant="caption" tone="secondary">
              Status
            </AppText>
            <View className="flex-row flex-wrap gap-2">
              {statuses.map((value) => (
                <Chip
                  key={value}
                  label={value.replace("_", " ")}
                  selected={status === value}
                  onPress={() => setStatus(value)}
                />
              ))}
            </View>
          </View>

          <View className="gap-3">
            <AppText variant="caption" tone="secondary">
              Priority
            </AppText>
            <View className="flex-row flex-wrap gap-2">
              {priorities.map((value) => (
                <Chip
                  key={value}
                  label={value}
                  selected={priority === value}
                  onPress={() => setPriority(value)}
                />
              ))}
            </View>
          </View>

          <View className="flex-row gap-3">
            <AppButton label="Save updates" onPress={handleSave} className="flex-1" />
            <AppButton
              label="Complete"
              onPress={() => markCompleted(taskId)}
              variant="secondary"
              className="flex-1"
            />
          </View>
        </Card>

        <Card className="gap-4">
          <SectionHeader
            title="Checklist"
            description="Break the idea down into shippable steps."
          />
          <View className="gap-3">
            {task.checklist.map((item) => (
              <Pressable
                key={item.id}
                className="flex-row items-center gap-3 rounded-3xl border border-border bg-surface-elevated px-4 py-4"
                onPress={() => toggleChecklistItem(taskId, item.id)}
              >
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border ${
                    item.completed
                      ? "border-success bg-success"
                      : "border-border-strong bg-surface"
                  }`}
                >
                  {item.completed ? <Check color="#F8FAFC" size={14} strokeWidth={2.4} /> : null}
                </View>
                <AppText className={item.completed ? "line-through opacity-60" : ""}>
                  {item.label}
                </AppText>
              </Pressable>
            ))}
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="Add a checklist item"
                value={checklistInput}
                onChangeText={setChecklistInput}
                placeholder="Define the next concrete step"
              />
            </View>
            <AppButton
              label="Add"
              onPress={() => {
                addChecklistItem(taskId, checklistInput);
                setChecklistInput("");
              }}
              icon={Plus}
              className="self-end"
            />
          </View>
        </Card>

        <Card className="gap-4">
          <SectionHeader
            title="Voice and attachments"
            description="Capture context fast, then keep images and files on this device for the current install."
          />
          <View className="flex-row gap-3">
            <AppButton
              label="Voice to text"
              onPress={() => setVoiceOpen(true)}
              icon={Sparkles}
              className="flex-1"
            />
            <AppButton
              label="Add image"
              onPress={handleAttachment}
              icon={ImagePlus}
              variant="secondary"
              className="flex-1"
            />
          </View>
          <View className="gap-3">
            {task.attachments.map((attachment) => (
              <View
                key={attachment.id}
                className="rounded-3xl border border-border bg-surface-elevated px-4 py-4"
              >
                <AppText variant="bodyStrong">{attachment.name}</AppText>
                <AppText variant="caption" tone="secondary">
                  {attachment.syncState === "local_only"
                    ? "stored locally"
                    : attachment.syncState.replace("_", " ")} ·{" "}
                  {Math.round(attachment.sizeInBytes / 1024)} KB
                </AppText>
              </View>
            ))}
            {!task.attachments.length ? (
              <AppText tone="secondary">
                No attachments yet. Pick an image and it will stay available on this device while the local file exists.
              </AppText>
            ) : null}
          </View>
        </Card>

        <Card className="gap-4">
          <SectionHeader
            title="Timeline"
            description="A compact history of what changed and when."
          />
          <View className="gap-4">
            {task.timeline.map((entry) => (
              <View key={entry.id} className="flex-row gap-3">
                <View className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                <View className="flex-1 gap-1">
                  <AppText variant="bodyStrong">{entry.message}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {formatDateTime(entry.createdAt)}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      <VoiceCaptureSheet
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onApply={(transcript) => appendVoiceTranscript(taskId, transcript)}
      />
    </Screen>
  );
};
