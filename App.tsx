import "./global.css";

import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { AppState, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";

import { AppLoadingScreen } from "@/components/app-loading-screen";
import { SyncStatusOverlay } from "@/components/sync-status-overlay";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { useAppTheme } from "@/hooks/use-app-theme";
import { AppNavigator } from "@/navigation/app-navigator";
import { syncService } from "@/services/sync/sync.service";
import { useConnectivityStore } from "@/store/connectivity-store";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import { useTasksStore } from "@/store/tasks-store";
import { useVaultStore } from "@/store/vault-store";

export default function App() {
  const ready = useAppBootstrap();
  const { palette, resolvedTheme, themeVars } = useAppTheme();
  const authResolved = useSessionStore((state) => state.authResolved);
  const authStatus = useSessionStore((state) => state.authStatus);
  const userId = useSessionStore((state) => state.userId);
  const syncStatus = useSyncStore((state) => state.status);
  const syncErrorMessage = useSyncStore((state) => state.errorMessage);
  const initialLoadComplete = useSyncStore((state) => state.initialLoadComplete);
  const taskIds = useTasksStore((state) => state.taskIds);
  const tasksById = useTasksStore((state) => state.tasksById);
  const vaultItemIds = useVaultStore((state) => state.itemIds);
  const vaultItemsById = useVaultStore((state) => state.itemsById);
  const isConnected = useConnectivityStore((state) => state.isConnected);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palette.background);
  }, [palette.background]);

  useEffect(() => {
    let wasConnected = useConnectivityStore.getState().isConnected;

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isConnected = Boolean(state.isConnected);
      useConnectivityStore.getState().setConnected(isConnected);

      if (
        !wasConnected &&
        isConnected &&
        useSessionStore.getState().authStatus === "authenticated"
      ) {
        void syncService.syncNowAsync();
      }

      wasConnected = isConnected;
    });

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        useSessionStore.getState().lockVault();
        return;
      }

      if (
        useConnectivityStore.getState().isConnected &&
        useSessionStore.getState().authStatus === "authenticated"
      ) {
        void syncService.syncNowAsync();
      }
    });

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!authResolved) {
      return;
    }

    if (authStatus === "authenticated" && userId) {
      void useTasksStore.getState().pruneMissingAttachmentsAsync();
      void syncService.startRealtimeSyncAsync(userId);
      return;
    }

    syncService.stopRealtimeSync();
    useSyncStore.getState().clearQueue();
  }, [authResolved, authStatus, userId]);

  if (!ready) {
    return null;
  }

  const hasCachedWorkspaceData = Boolean(
    userId &&
      (taskIds.some((taskId) => tasksById[taskId]?.userId === userId) ||
        vaultItemIds.some((itemId) => vaultItemsById[itemId]?.userId === userId)),
  );
  const showStartupLoader =
    authStatus === "authenticated" &&
    !initialLoadComplete &&
    !hasCachedWorkspaceData;
  const startupLoaderVariant =
    !isConnected && !hasCachedWorkspaceData ? "offline" : "loading";
  const startupLoaderTitle =
    startupLoaderVariant === "offline"
      ? "Offline startup"
      : "Loading your workspace";
  const startupLoaderDescription =
    startupLoaderVariant === "offline"
      ? "There is no cached workspace data on this device yet. Reconnect once so your latest tasks and vault metadata can be restored."
      : "Tasks, secure metadata, and local state are being restored before the workspace opens.";

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={themeVars} className="flex-1 bg-background">
          <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
          {showStartupLoader ? (
            <AppLoadingScreen
              title={startupLoaderTitle}
              description={startupLoaderDescription}
              variant={startupLoaderVariant}
            />
          ) : (
            <>
              <AppNavigator />
              <SyncStatusOverlay
                status={syncStatus}
                message={syncStatus === "error" ? syncErrorMessage : undefined}
              />
            </>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
