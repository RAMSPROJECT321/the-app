import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react-native";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { SyncStatus } from "@/types/sync";

interface SyncStatusOverlayProps {
  status: SyncStatus;
  message?: string;
}

const overlayConfig = {
  syncing: {
    title: "Syncing changes",
    description: "Refreshing your workspace and pushing local updates.",
    icon: RefreshCw,
    tone: "accent" as const,
  },
  offline: {
    title: "Offline mode",
    description: "Working from local data. Changes will sync when you reconnect.",
    icon: WifiOff,
    tone: "warning" as const,
  },
  error: {
    title: "Sync attention needed",
    description: "Local changes are preserved. Retry once connectivity is stable.",
    icon: AlertTriangle,
    tone: "danger" as const,
  },
} satisfies Record<
  Exclude<SyncStatus, "idle">,
  {
    title: string;
    description: string;
    icon: typeof RefreshCw;
    tone: "accent" | "warning" | "danger";
  }
>;

export const SyncStatusOverlay = ({ status, message }: SyncStatusOverlayProps) => {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();

  if (status === "idle") {
    return null;
  }

  const config = overlayConfig[status];
  const Icon = config.icon;
  const toneClasses =
    config.tone === "danger"
      ? "border-danger/20 bg-danger/10"
      : config.tone === "warning"
        ? "border-warning/20 bg-warning/10"
        : "border-accent/15 bg-accent-soft";
  const iconColor =
    config.tone === "danger"
      ? palette.danger
      : config.tone === "warning"
        ? palette.warning
        : palette.accent;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      className="absolute left-5 right-5 z-50"
      style={{
        top: Math.max(insets.top + 8, 16),
      }}
    >
      <View className={`rounded-[28px] border px-4 py-4 shadow-floating ${toneClasses}`}>
        <View className="flex-row items-start gap-3">
          <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-2xl bg-surface">
            <Icon color={iconColor} size={18} strokeWidth={2.2} />
          </View>
          <View className="flex-1 gap-1">
            <AppText variant="bodyStrong">{config.title}</AppText>
            <AppText variant="caption" tone="secondary">
              {message ?? config.description}
            </AppText>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};
