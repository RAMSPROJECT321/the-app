import { Pressable } from "react-native";

import { AppText } from "@/components/app-text";
import { cn } from "@/utils/cn";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export const Chip = ({ label, selected, onPress }: ChipProps) => (
  <Pressable
    className={cn(
      "rounded-full border px-4 py-2",
      selected
        ? "border-accent bg-accent-soft"
        : "border-border bg-surface-elevated",
    )}
    onPress={onPress}
  >
    <AppText variant="caption" tone={selected ? "accent" : "secondary"}>
      {label}
    </AppText>
  </Pressable>
);
