import { AlertTriangle, RefreshCw, WifiOff, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { SyncStatus } from "@/types/sync";

interface SyncStatusOverlayProps {
  status: SyncStatus;
  message?: string;
}

const autoHideDurationByStatus: Partial<Record<Exclude<SyncStatus, "idle">, number>> = {
  syncing: 2400,
  offline: 4200,
};

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
  const [visible, setVisible] = useState(status !== "idle");
  const lastPresentedStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "idle") {
      setVisible(false);
      lastPresentedStatusRef.current = null;
      return;
    }

    const nextPresentationKey = `${status}:${message ?? ""}`;

    if (lastPresentedStatusRef.current !== nextPresentationKey) {
      setVisible(true);
      lastPresentedStatusRef.current = nextPresentationKey;
    }

    const autoHideDuration = autoHideDurationByStatus[status];

    if (!autoHideDuration) {
      return;
    }

    const timeout = setTimeout(() => {
      setVisible(false);
    }, autoHideDuration);

    return () => {
      clearTimeout(timeout);
    };
  }, [status, message]);

  if (status === "idle" || !visible) {
    return null;
  }

  const config = overlayConfig[status];
  const Icon = config.icon;
  const accentClasses =
    config.tone === "danger"
      ? "bg-danger/10"
      : config.tone === "warning"
        ? "bg-warning/10"
        : "bg-accent-soft";
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
      pointerEvents="box-none"
      className="absolute left-5 right-5 z-50"
      style={{
        top: Math.max(insets.top + 8, 16),
      }}
    >
      <View className="rounded-[28px] border border-border bg-surface-elevated px-4 py-4 shadow-floating">
        <View className="flex-row items-start gap-3">
          <View className={`mt-0.5 h-10 w-10 items-center justify-center rounded-2xl ${accentClasses}`}>
            <Icon color={iconColor} size={18} strokeWidth={2.2} />
          </View>
          <View className="flex-1 gap-1">
            <AppText
              variant="bodyStrong"
              tone={
                config.tone === "danger"
                  ? "danger"
                  : config.tone === "warning"
                    ? "warning"
                    : "accent"
              }
            >
              {config.title}
            </AppText>
            <AppText variant="caption" tone="secondary">
              {message ?? config.description}
            </AppText>
          </View>
          <Pressable
            accessibilityLabel="Dismiss sync status"
            className="h-8 w-8 items-center justify-center rounded-full bg-background-muted"
            onPress={() => setVisible(false)}
          >
            <X color={palette.textSecondary} size={16} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};
