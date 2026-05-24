import { Pressable } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useAppTheme } from "@/hooks/use-app-theme";
import { cn } from "@/utils/cn";

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  className?: string;
  tone?: "default" | "accent" | "danger";
}

const toneClassMap = {
  default: "bg-surface-elevated border-border",
  accent: "bg-accent-soft border-accent/15",
  danger: "bg-danger/10 border-danger/20",
} as const;

export const IconButton = ({
  icon: Icon,
  onPress,
  className,
  tone = "default",
}: IconButtonProps) => {
  const { palette } = useAppTheme();

  return (
    <Pressable
      className={cn(
        "h-11 w-11 items-center justify-center rounded-2xl border",
        toneClassMap[tone],
        className,
      )}
      onPress={onPress}
    >
      <Icon
        color={tone === "danger" ? palette.danger : palette.textPrimary}
        size={18}
        strokeWidth={2.2}
      />
    </Pressable>
  );
};
