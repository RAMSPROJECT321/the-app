import { memo } from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { cn } from "@/utils/cn";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardPressableProps extends PressableProps {
  className?: string;
}

export const CardPressable = memo(
  ({ className, children, ...rest }: CardPressableProps) => (
    <AnimatedPressable
      entering={FadeInDown.duration(260)}
      className={cn(
        "rounded-3xl border border-border bg-surface px-5 py-5 shadow-subtle active:opacity-95",
        className,
      )}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  ),
);

CardPressable.displayName = "CardPressable";
