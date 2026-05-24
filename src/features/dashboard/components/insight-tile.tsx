import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { useAppTheme } from "@/hooks/use-app-theme";

interface InsightTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  tone: "accent" | "success" | "warning" | "vault";
}

const toneClassMap = {
  accent: "bg-accent-soft",
  success: "bg-success/10",
  warning: "bg-warning/10",
  vault: "bg-vault/10",
} as const;

export const InsightTile = ({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: InsightTileProps) => {
  const { palette } = useAppTheme();

  const iconColor =
    tone === "success"
      ? palette.success
      : tone === "warning"
        ? palette.warning
        : tone === "vault"
          ? palette.vault
          : palette.accent;

  return (
    <Card className="min-w-[47%] flex-1 gap-3 px-4 py-4">
      <View className={`h-11 w-11 items-center justify-center rounded-2xl ${toneClassMap[tone]}`}>
        <Icon color={iconColor} size={18} strokeWidth={2.2} />
      </View>
      <View className="gap-1">
        <AppText variant="caption" tone="secondary">
          {label}
        </AppText>
        <AppText variant="title">{value}</AppText>
        <AppText variant="caption" tone="tertiary">
          {helper}
        </AppText>
      </View>
    </Card>
  );
};
