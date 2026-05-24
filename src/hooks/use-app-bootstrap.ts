import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";

import { authService } from "@/services/auth/auth.service";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import { useTasksStore } from "@/store/tasks-store";
import { useVaultStore } from "@/store/vault-store";

void SplashScreen.preventAutoHideAsync();

export const useAppBootstrap = () => {
  const bootstrapStartedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const sessionHydrated = useSessionStore((state) => state.hydrated);
  const tasksHydrated = useTasksStore((state) => state.hydrated);
  const vaultHydrated = useVaultStore((state) => state.hydrated);
  const syncHydrated = useSyncStore((state) => state.hydrated);
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (
      (!fontsLoaded && !fontError) ||
      bootstrapStartedRef.current ||
      !sessionHydrated ||
      !tasksHydrated ||
      !vaultHydrated ||
      !syncHydrated
    ) {
      return;
    }

    bootstrapStartedRef.current = true;

    const bootstrapAsync = async () => {
      useSessionStore.getState().ensureDeviceId();
      await authService.initializeAsync();
      setReady(true);
      await SplashScreen.hideAsync();
    };

    void bootstrapAsync();
  }, [
    fontError,
    fontsLoaded,
    sessionHydrated,
    syncHydrated,
    tasksHydrated,
    vaultHydrated,
  ]);

  return ready;
};
