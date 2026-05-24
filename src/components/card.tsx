import { memo } from "react";
import { View, type ViewProps } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { cn } from "@/utils/cn";

const AnimatedView = Animated.createAnimatedComponent(View);

interface CardProps extends ViewProps {
  className?: string;
}

export const Card = memo(({ className, children, ...rest }: CardProps) => (
  <AnimatedView
    entering={FadeInDown.duration(260)}
    className={cn(
      "rounded-3xl border border-border bg-surface px-5 py-5 shadow-subtle",
      className,
    )}
    {...rest}
  >
    {children}
  </AnimatedView>
));

Card.displayName = "Card";
