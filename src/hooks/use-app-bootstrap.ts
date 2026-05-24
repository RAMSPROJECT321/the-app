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

import { useSessionStore } from "@/store/session-store";
import { useTasksStore } from "@/store/tasks-store";
import { useVaultStore } from "@/store/vault-store";

void SplashScreen.preventAutoHideAsync();

export const useAppBootstrap = () => {
  const bootstrapStartedRef = useRef(false);
  const [ready, setReady] = useState(false);
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
    if ((!fontsLoaded && !fontError) || bootstrapStartedRef.current) {
      return;
    }

    bootstrapStartedRef.current = true;

    const bootstrapAsync = async () => {
      useSessionStore.getState().ensureDeviceId();
      useTasksStore.getState().seedDemoData();
      await useVaultStore.getState().seedDemoDataAsync();
      setReady(true);
      await SplashScreen.hideAsync();
    };

    void bootstrapAsync();
  }, [fontError, fontsLoaded]);

  return ready;
};
