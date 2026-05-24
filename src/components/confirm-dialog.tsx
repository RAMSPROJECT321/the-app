import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Modal
    animationType="fade"
    onRequestClose={onCancel}
    presentationStyle="overFullScreen"
    transparent
    visible={visible}
  >
    <SafeAreaView className="flex-1 bg-overlay/45 px-5" edges={["top", "bottom", "left", "right"]}>
      <Pressable className="absolute inset-0" onPress={onCancel} />
      <View className="flex-1 items-center justify-center">
        <Pressable className="w-full" onPress={() => undefined}>
          <Card className="gap-5 rounded-[32px] px-5 py-6">
            <View className="gap-2">
              <AppText variant="title">{title}</AppText>
              <AppText tone="secondary">{description}</AppText>
            </View>

            <View className="flex-row gap-3">
              <AppButton
                label={cancelLabel}
                onPress={onCancel}
                variant="secondary"
                className="flex-1"
              />
              <AppButton
                label={confirmLabel}
                onPress={onConfirm}
                variant={confirmVariant}
                loading={loading}
                className="flex-1"
              />
            </View>
          </Card>
        </Pressable>
      </View>
    </SafeAreaView>
  </Modal>
);
