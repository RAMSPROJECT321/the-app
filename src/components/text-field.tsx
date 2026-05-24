import { TextInput, View, type TextInputProps } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { AppText } from "@/components/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { cn } from "@/utils/cn";

interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
  multiline?: boolean;
}

export const TextField = ({
  label,
  hint,
  icon: Icon,
  className,
  multiline,
  ...rest
}: TextFieldProps) => {
  const { palette } = useAppTheme();

  return (
    <View className={cn("gap-2", className)}>
      {label ? (
        <AppText variant="caption" tone="secondary">
          {label}
        </AppText>
      ) : null}
      <View
        className={cn(
          "min-h-14 flex-row items-start gap-3 rounded-3xl border border-border bg-surface-elevated px-4 py-4",
          multiline ? "items-start" : "items-center",
        )}
      >
        {Icon ? <Icon color={palette.textSecondary} size={18} strokeWidth={2.1} /> : null}
        <TextInput
          className={cn(
            "flex-1 font-body text-sm text-text-primary",
            multiline ? "min-h-24 pt-0" : "",
          )}
          multiline={multiline}
          placeholderTextColor={palette.textTertiary}
          {...rest}
        />
      </View>
      {hint ? (
        <AppText variant="caption" tone="tertiary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
};
