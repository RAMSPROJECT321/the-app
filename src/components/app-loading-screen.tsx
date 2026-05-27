import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, Sparkles } from "lucide-react-native";

import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { APP_CONFIG } from "@/constants/app";
import { useAppTheme } from "@/hooks/use-app-theme";

interface AppLoadingScreenProps {
  title: string;
  description: string;
  eyebrow?: string;
  variant?: "loading" | "offline";
}

export const AppLoadingScreen = ({
  title,
  description,
  eyebrow,
  variant = "loading",
}: AppLoadingScreenProps) => {
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className="flex-1 bg-background px-5" edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 justify-center">
        <View className="absolute -left-10 top-24 h-40 w-40 rounded-full bg-accent/10" />
        <View className="absolute -right-12 bottom-24 h-44 w-44 rounded-full bg-vault/10" />

        <Card className="gap-6 overflow-hidden rounded-[36px] bg-surface-elevated px-6 py-7">
          <View className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/10" />
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-accent/12">
              {variant === "offline" ? (
                <ShieldCheck color={palette.vault} size={24} strokeWidth={2.2} />
              ) : (
                <Sparkles color={palette.accent} size={24} strokeWidth={2.2} />
              )}
            </View>
            <View className="flex-1 gap-1">
              <AppText variant="label" tone="accent">
                {eyebrow ?? APP_CONFIG.appName}
              </AppText>
              <AppText variant="title">{title}</AppText>
            </View>
          </View>

          <View className="gap-2">
            <AppText tone="secondary">{description}</AppText>
            <View className="flex-row items-center gap-3 rounded-3xl bg-background-muted px-4 py-3">
              <ActivityIndicator color={variant === "offline" ? palette.vault : palette.accent} />
              <AppText variant="caption" tone="secondary">
                {variant === "offline"
                  ? "Waiting for a connection or local workspace data."
                  : "Preparing your workspace and restoring the latest state."}
              </AppText>
            </View>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};
