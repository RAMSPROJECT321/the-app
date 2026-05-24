import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";

import { AppText } from "@/components/app-text";
import { AppButton } from "@/components/app-button";
import { Card } from "@/components/card";
import { useAppTheme } from "@/hooks/use-app-theme";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onActionPress,
}: EmptyStateProps) => {
  const { palette } = useAppTheme();

  return (
    <Card className="items-center gap-4 px-6 py-8">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <Icon color={palette.accent} size={22} strokeWidth={2.2} />
      </View>
      <View className="items-center gap-2">
        <AppText variant="title" className="text-center">
          {title}
        </AppText>
        <AppText tone="secondary" className="text-center">
          {description}
        </AppText>
      </View>
      {actionLabel && onActionPress ? (
        <AppButton label={actionLabel} onPress={onActionPress} className="min-w-40" />
      ) : null}
    </Card>
  );
};
