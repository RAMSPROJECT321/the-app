import "./global.css";

import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { AppState, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";

import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { useAppTheme } from "@/hooks/use-app-theme";
import { AppNavigator } from "@/navigation/app-navigator";
import { syncService } from "@/services/sync/sync.service";
import { useConnectivityStore } from "@/store/connectivity-store";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import { useTasksStore } from "@/store/tasks-store";

export default function App() {
  const ready = useAppBootstrap();
  const { palette, resolvedTheme, themeVars } = useAppTheme();
  const authResolved = useSessionStore((state) => state.authResolved);
  const authStatus = useSessionStore((state) => state.authStatus);
  const userId = useSessionStore((state) => state.userId);

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

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={themeVars} className="flex-1 bg-background">
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        <AppNavigator />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
