import { View } from "react-native";

import { cn } from "@/utils/cn";

interface SkeletonBlockProps {
  className?: string;
}

export const SkeletonBlock = ({ className }: SkeletonBlockProps) => (
  <View
    className={cn(
      "overflow-hidden rounded-2xl bg-surface-strong/65",
      className,
    )}
  />
);
