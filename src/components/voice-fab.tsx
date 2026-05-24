import { Mic } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

interface VoiceFabProps {
  onPress: () => void;
}

export const VoiceFab = ({ onPress }: VoiceFabProps) => {
  const { palette } = useAppTheme();

  return (
    <View className="absolute bottom-32 right-5">
      <Pressable className="flex-row items-center gap-3" onPress={onPress}>
        <View className="rounded-full bg-surface px-3 py-2 shadow-subtle">
          <AppText variant="caption">Voice note</AppText>
        </View>
        <View className="h-16 w-16 items-center justify-center rounded-full bg-accent shadow-floating">
          <Mic color={palette.textInverse} size={22} strokeWidth={2.4} />
        </View>
      </Pressable>
    </View>
  );
};
