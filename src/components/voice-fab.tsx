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
          900,
          withTiming(1, {
            duration: 420,
            easing: Easing.out(Easing.cubic),
          }),
        ),
        withDelay(
          2200,
          withTiming(0, {
            duration: 320,
            easing: Easing.inOut(Easing.cubic),
          }),
        ),
        withDelay(2400, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(revealProgress);
    };
  }, [revealProgress]);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(revealProgress.value, [0, 0.14, 0.92, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateX: interpolate(revealProgress.value, [0, 1], [24, 0]),
      },
    ],
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(revealProgress.value, [0, 0.5, 1], [0, -4, 0]),
      },
      {
        scale: interpolate(revealProgress.value, [0, 0.5, 1], [1, 1.025, 1]),
      },
    ],
  }));

  return (
    <View className="absolute bottom-36 right-5 h-16 items-end justify-center">
      <View
        pointerEvents="none"
        className="absolute right-20 top-5 h-6 w-36 items-end justify-center overflow-hidden"
      >
        <Animated.View style={labelAnimatedStyle}>
          <AppText
            numberOfLines={1}
            className="font-display text-sm tracking-[0.18em]"
          >
            VOICE NOTE
          </AppText>
        </Animated.View>
      </View>

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
