import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "@/utils/cn";

interface ScreenProps extends ViewProps {
  scrollable?: boolean;
  contentClassName?: string;
}

export const Screen = ({
  scrollable = true,
  className,
  contentClassName,
  children,
}: ScreenProps) => {
  const content = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={cn("gap-6 px-5 pb-40 pt-3", contentClassName)}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={cn("flex-1 gap-6 px-5 pb-40 pt-3", contentClassName)}>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={cn("flex-1 bg-background", className)}>
      <KeyboardAvoidingView
        behavior={Platform.select({
          ios: "padding",
          default: undefined,
        })}
        className="flex-1"
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
