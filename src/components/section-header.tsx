import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { AppText } from "@/components/app-text";
import { IconButton } from "@/components/icon-button";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actionIcon?: LucideIcon;
  onActionPress?: () => void;
}

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  actionIcon,
  onActionPress,
}: SectionHeaderProps) => (
  <View className="flex-row items-start justify-between gap-4">
    <View className="flex-1 gap-1">
      {eyebrow ? (
        <AppText variant="label" tone="accent">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="title">{title}</AppText>
      {description ? (
        <AppText tone="secondary">{description}</AppText>
      ) : null}
    </View>
    {actionIcon && onActionPress ? (
      <IconButton icon={actionIcon} onPress={onActionPress} />
    ) : null}
  </View>
);
