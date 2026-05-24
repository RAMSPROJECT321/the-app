import { useEffect } from "react";
import { Mic } from "lucide-react-native";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

interface VoiceFabProps {
  onPress: () => void;
}

export const VoiceFab = ({ onPress }: VoiceFabProps) => {
  const { palette } = useAppTheme();
  const revealProgress = useSharedValue(0);

  useEffect(() => {
    revealProgress.value = withRepeat(
      withSequence(
        withDelay(
          500,
          withTiming(1, {
            duration: 280,
            easing: Easing.out(Easing.cubic),
          }),
        ),
        withDelay(
          1400,
          withTiming(0, {
            duration: 240,
            easing: Easing.in(Easing.cubic),
          }),
        ),
        withDelay(1800, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(revealProgress);
    };
  }, [revealProgress]);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(revealProgress.value, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateX: interpolate(revealProgress.value, [0, 1], [24, 0]),
      },
    ],
    width: interpolate(revealProgress.value, [0, 1], [0, 102]),
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(revealProgress.value, [0, 0.5, 1], [0, -5, 0]),
      },
      {
        scale: interpolate(revealProgress.value, [0, 0.5, 1], [1, 1.03, 1]),
      },
    ],
  }));

  return (
    <View className="absolute bottom-36 right-5 h-16 items-end justify-center">
      <Animated.View
        pointerEvents="none"
        style={labelAnimatedStyle}
        className="absolute right-14 top-2 overflow-hidden"
      >
        <View className="rounded-full bg-surface px-4 py-3 shadow-subtle">
          <AppText variant="caption">Voice note</AppText>
        </View>
      </Animated.View>

      <Pressable
        accessibilityHint="Opens voice capture and turns speech into a new task draft."
        accessibilityLabel="Voice note"
        className="h-16 w-16 items-center justify-center rounded-full bg-accent shadow-floating"
        onPress={onPress}
      >
        <Animated.View style={micAnimatedStyle}>
          <Mic color={palette.textInverse} size={22} strokeWidth={2.4} />
        </Animated.View>
      </Pressable>
    </View>
  );
};
