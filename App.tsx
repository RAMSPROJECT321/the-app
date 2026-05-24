import "./global.css";

import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";

import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { useAppTheme } from "@/hooks/use-app-theme";
import { AppNavigator } from "@/navigation/app-navigator";
import { syncService } from "@/services/sync/sync.service";
import { useConnectivityStore } from "@/store/connectivity-store";
import { useSessionStore } from "@/store/session-store";

export default function App() {
  const ready = useAppBootstrap();
  const { palette, resolvedTheme } = useAppTheme();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palette.background);
  }, [palette.background]);

  useEffect(() => {
    let wasConnected = useConnectivityStore.getState().isConnected;

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isConnected = Boolean(state.isConnected);
      useConnectivityStore.getState().setConnected(isConnected);

      if (!wasConnected && isConnected) {
        void syncService.syncNowAsync();
      }

      wasConnected = isConnected;
    });

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        useSessionStore.getState().lockVault();
        return;
      }

      if (useConnectivityStore.getState().isConnected) {
        void syncService.syncNowAsync();
      }
    });

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1 bg-background">
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
