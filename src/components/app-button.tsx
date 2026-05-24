import { ActivityIndicator, Pressable, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { AppText } from "@/components/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const containerClassMap: Record<ButtonVariant, string> = {
  primary: "bg-accent",
  secondary: "border border-border bg-surface-elevated",
  ghost: "bg-transparent",
  danger: "bg-danger",
};

const labelToneMap: Record<ButtonVariant, "inverse" | "primary"> = {
  primary: "inverse",
  secondary: "primary",
  ghost: "primary",
  danger: "inverse",
};

export const AppButton = ({
  label,
  onPress,
  icon: Icon,
  variant = "primary",
  disabled,
  loading,
  className,
}: AppButtonProps) => {
  const { palette } = useAppTheme();
  const iconColor =
    labelToneMap[variant] === "inverse" ? palette.textInverse : palette.textPrimary;

  return (
    <Pressable
      className={cn(
        "min-h-14 flex-row items-center justify-center gap-3 rounded-2xl px-5",
        containerClassMap[variant],
        disabled ? "opacity-50" : "active:opacity-85",
        className,
      )}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View className="flex-row items-center gap-3">
          {Icon ? <Icon color={iconColor} size={18} strokeWidth={2.2} /> : null}
          <AppText variant="bodyStrong" tone={labelToneMap[variant]}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
};
