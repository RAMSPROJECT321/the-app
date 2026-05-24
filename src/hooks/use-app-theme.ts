import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { useEffect, useMemo } from "react";

import { useThemeStore } from "@/store/theme-store";
import { darkPalette, lightPalette, themeTokens } from "@/theme";

export const useAppTheme = () => {
  const preference = useThemeStore((state) => state.preference);
  const { setColorScheme } = useNativeWindColorScheme();
  const systemColorScheme = useSystemColorScheme();

  useEffect(() => {
    setColorScheme(preference);
  }, [preference, setColorScheme]);

  const resolvedTheme: "light" | "dark" =
    preference === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const palette = useMemo(
    () => (resolvedTheme === "dark" ? darkPalette : lightPalette),
    [resolvedTheme],
  );

  return {
    palette,
    resolvedTheme,
    preference,
    themeTokens,
  };
};
