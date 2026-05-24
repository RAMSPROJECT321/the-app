import { Cloud, CloudOff, LogOut, MoonStar, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Alert, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { ErrorState } from "@/components/error-state";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { APP_CONFIG, APP_MESSAGES, hasFirebaseConfig } from "@/constants/app";
import { authService } from "@/services/auth/auth.service";
import { syncService } from "@/services/sync/sync.service";
import { useConnectivityStore } from "@/store/connectivity-store";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import { useTasksStore } from "@/store/tasks-store";
import { useThemeStore } from "@/store/theme-store";

export const SettingsScreen = () => {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const syncStatus = useSyncStore((state) => state.status);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const syncErrorCode = useSyncStore((state) => state.errorCode);
  const syncErrorMessage = useSyncStore((state) => state.errorMessage);
  const isConnected = useConnectivityStore((state) => state.isConnected);
  const userId = useSessionStore((state) => state.userId);
  const email = useSessionStore((state) => state.email);
  const deviceId = useSessionStore((state) => state.deviceId);
  const localAttachmentCount = useTasksStore((state) =>
    state.taskIds.reduce((count, taskId) => {
      const task = state.tasksById[taskId];
      return task?.userId === userId ? count + task.attachments.length : count;
    }, 0),
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSyncNow = async () => {
    setSyncing(true);
    const result = await syncService.syncNowAsync();
    setSyncMessage(result.message);
    setSyncing(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await authService.signOutAsync();
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignOutPress = () => {
    Alert.alert(
      "Sign out",
      "You will leave the current workspace on this device. Local vault secrets stay protected and require sign-in again to access synced metadata.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            void handleSignOut();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <SectionHeader
        eyebrow="Foundation controls"
        title="Settings"
        description="Theme, sync, authentication, and vault defaults are centralized here for future expansion."
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
            <AppText variant="subtitle">Account and device</AppText>
            <AppText tone="secondary">
              Firebase Auth scopes each user while secure local storage protects secrets on this device.
            </AppText>
          </View>
        </View>
        <View className="gap-2 rounded-3xl bg-background-muted px-4 py-4">
          <AppText variant="caption" tone="secondary">
            Email
          </AppText>
          <AppText variant="bodyStrong">{email ?? "Not available"}</AppText>
          <AppText variant="caption" tone="secondary">
            User ID
          </AppText>
          <AppText variant="bodyStrong">{userId ?? "Not signed in"}</AppText>
          <AppText variant="caption" tone="secondary">
            Device ID
          </AppText>
          <AppText variant="bodyStrong">{deviceId}</AppText>
        </View>
        <AppButton
          label="Sign out"
          onPress={handleSignOutPress}
          icon={LogOut}
          variant="secondary"
          loading={signingOut}
        />
      </Card>

      <Card className="gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-warning/10">
            <CloudOff color="#D27B2C" size={20} strokeWidth={2.2} />
          </View>
          <View className="flex-1 gap-1">
            <AppText variant="subtitle">Realtime sync</AppText>
            <AppText tone="secondary">
              Firestore handles document sync. Attachments stay local on this device and do not sync through Firebase.
            </AppText>
          </View>
        </View>
        <View className="gap-2 rounded-3xl bg-background-muted px-4 py-4">
          <AppText variant="caption" tone="secondary">
            Sync status
          </AppText>
          <AppText variant="bodyStrong">{syncStatus}</AppText>
          <AppText variant="caption" tone="secondary">
            Connectivity
          </AppText>
          <AppText variant="bodyStrong">{isConnected ? "Online" : "Offline"}</AppText>
          <AppText variant="caption" tone="secondary">
            Local attachments
          </AppText>
          <AppText variant="bodyStrong">{localAttachmentCount} files</AppText>
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
        {syncMessage ? <AppText tone="secondary">{syncMessage}</AppText> : null}
        {syncErrorMessage ? (
          <View className="gap-1 rounded-3xl border border-danger/20 bg-danger/10 px-4 py-4">
            <AppText variant="caption" tone="secondary">
              Last sync error
            </AppText>
            <AppText variant="bodyStrong">
              {syncErrorCode ?? "unknown"}: {syncErrorMessage}
            </AppText>
          </View>
        ) : null}
      </Card>

      <Card className="gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
            <Cloud color="#3778FF" size={20} strokeWidth={2.2} />
          </View>
          <View className="flex-1 gap-1">
            <AppText variant="subtitle">Backend model</AppText>
            <AppText tone="secondary">
              Firebase Auth scopes each user. Firestore syncs tasks and vault metadata. Attachments stay local to the current device.
            </AppText>
          </View>
        </View>
      </Card>

      {__DEV__ ? (
        <Card className="gap-4">
          <View className="flex-1 gap-1">
            <AppText variant="subtitle">Debug diagnostics</AppText>
            <AppText tone="secondary">
              Use this with the console logs to confirm auth identity, Firebase project, and the latest sync failure.
            </AppText>
          </View>
          <View className="gap-2 rounded-3xl bg-background-muted px-4 py-4">
            <AppText variant="caption" tone="secondary">
              Firebase project
            </AppText>
            <AppText variant="bodyStrong">{APP_CONFIG.firebase.projectId || "Missing"}</AppText>
            <AppText variant="caption" tone="secondary">
              Debug hint
            </AppText>
            <AppText variant="bodyStrong">
              {syncErrorCode === "permission-denied"
                ? APP_MESSAGES.firestorePermissionDenied
                : "Watch the console for [AegisFlow] auth/firestore/sync logs."}
            </AppText>
          </View>
        </Card>
      ) : null}

      {!hasFirebaseConfig ? (
        <ErrorState
          title="Firebase not configured"
          description={APP_MESSAGES.missingFirebaseConfig}
        />
      ) : null}
    </Screen>
  );
};
