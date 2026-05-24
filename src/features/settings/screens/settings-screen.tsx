import { CloudOff, MoonStar, ShieldCheck, SunMedium } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { APP_CONFIG } from "@/constants/app";
import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { ErrorState } from "@/components/error-state";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { syncService } from "@/services/sync/sync.service";
import { useConnectivityStore } from "@/store/connectivity-store";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import { useThemeStore } from "@/store/theme-store";

export const SettingsScreen = () => {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const syncStatus = useSyncStore((state) => state.status);
  const queue = useSyncStore((state) => state.queue);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const isConnected = useConnectivityStore((state) => state.isConnected);
  const userId = useSessionStore((state) => state.userId);
  const deviceId = useSessionStore((state) => state.deviceId);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSyncNow = async () => {
    setSyncing(true);
    const result = await syncService.syncPendingChangesAsync();
    setSyncMessage(result.message);
    setSyncing(false);
  };

  return (
    <Screen>
      <SectionHeader
        eyebrow="Foundation controls"
        title="Settings"
        description="Theme, sync, and security defaults are centralized here for future expansion."
      />

      <Card className="gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
            <MoonStar color="#3778FF" size={20} strokeWidth={2.2} />
          </View>
          <View className="flex-1 gap-1">
            <AppText variant="subtitle">Theme mode</AppText>
            <AppText tone="secondary">
              NativeWind and navigation both follow this single preference.
            </AppText>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {["system", "light", "dark"].map((option) => (
            <Chip
              key={option}
              label={option}
              selected={preference === option}
              onPress={() => setPreference(option as typeof preference)}
            />
          ))}
        </View>
      </Card>

      <Card className="gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-vault/10">
            <ShieldCheck color="#0F766E" size={20} strokeWidth={2.2} />
          </View>
          <View className="flex-1 gap-1">
            <AppText variant="subtitle">Security model</AppText>
            <AppText tone="secondary">
              Vault data uses biometric gating and device secure storage.
            </AppText>
          </View>
        </View>
        <View className="gap-2 rounded-3xl bg-background-muted px-4 py-4">
          <AppText variant="caption" tone="secondary">
            User ID
          </AppText>
          <AppText variant="bodyStrong">{userId}</AppText>
          <AppText variant="caption" tone="secondary">
            Device ID
          </AppText>
          <AppText variant="bodyStrong">{deviceId}</AppText>
        </View>
      </Card>

      <Card className="gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-warning/10">
            <CloudOff color="#D27B2C" size={20} strokeWidth={2.2} />
          </View>
          <View className="flex-1 gap-1">
            <AppText variant="subtitle">Local sync queue</AppText>
            <AppText tone="secondary">
              Multi-user-ready payloads are staged locally until Apps Script is configured.
            </AppText>
          </View>
        </View>
        <View className="gap-2 rounded-3xl bg-background-muted px-4 py-4">
          <AppText variant="caption" tone="secondary">
            Connectivity
          </AppText>
          <AppText variant="bodyStrong">{isConnected ? "Online" : "Offline"}</AppText>
          <AppText variant="caption" tone="secondary">
            Queue size
          </AppText>
          <AppText variant="bodyStrong">{queue.length} pending operations</AppText>
          <AppText variant="caption" tone="secondary">
            Last synced
          </AppText>
          <AppText variant="bodyStrong">{lastSyncedAt ?? "Not synced yet"}</AppText>
        </View>
        <AppButton
          label={syncStatus === "syncing" ? "Syncing…" : "Sync now"}
          onPress={() => void handleSyncNow()}
          loading={syncing}
        />
        {syncMessage ? (
          <AppText tone="secondary">{syncMessage}</AppText>
        ) : null}
      </Card>

      {!APP_CONFIG.googleAppsScriptBaseUrl ? (
        <ErrorState
          title="Apps Script not configured"
          description="Add your Apps Script web app URL in app config to move from local-first mode to actual background sync."
        />
      ) : null}
    </Screen>
  );
};
