import { useColorScheme as useNativeWindColorScheme, vars } from "nativewind";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { useEffect, useMemo } from "react";

import { useThemeStore } from "@/store/theme-store";
import { darkPalette, lightPalette, themeTokens } from "@/theme";

const hexToRgbChannels = (hex: string) => {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalized;

  const red = Number.parseInt(safeHex.slice(0, 2), 16);
  const green = Number.parseInt(safeHex.slice(2, 4), 16);
  const blue = Number.parseInt(safeHex.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
};

export const useAppTheme = () => {
  const preference = useThemeStore((state) => state.preference);
  const { setColorScheme } = useNativeWindColorScheme();
  const systemColorScheme = useSystemColorScheme();

  const resolvedTheme: "light" | "dark" =
    preference === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  useEffect(() => {
    setColorScheme(resolvedTheme);
  }, [resolvedTheme, setColorScheme]);

  const palette = useMemo(
    () => (resolvedTheme === "dark" ? darkPalette : lightPalette),
    [resolvedTheme],
  );
  const themeVars = useMemo(
    () =>
      vars({
        "--color-background": hexToRgbChannels(palette.background),
        "--color-background-muted": hexToRgbChannels(palette.backgroundMuted),
        "--color-surface": hexToRgbChannels(palette.surface),
        "--color-surface-elevated": hexToRgbChannels(palette.surfaceElevated),
        "--color-surface-strong": hexToRgbChannels(palette.surfaceStrong),
        "--color-border": hexToRgbChannels(palette.border),
        "--color-border-strong": hexToRgbChannels(palette.borderStrong),
        "--color-accent": hexToRgbChannels(palette.accent),
        "--color-accent-soft": hexToRgbChannels(palette.accentSoft),
        "--color-success": hexToRgbChannels(palette.success),
        "--color-warning": hexToRgbChannels(palette.warning),
        "--color-danger": hexToRgbChannels(palette.danger),
        "--color-info": hexToRgbChannels(palette.info),
        "--color-vault": hexToRgbChannels(palette.vault),
        "--color-text-primary": hexToRgbChannels(palette.textPrimary),
        "--color-text-secondary": hexToRgbChannels(palette.textSecondary),
        "--color-text-tertiary": hexToRgbChannels(palette.textTertiary),
        "--color-text-inverse": hexToRgbChannels(palette.textInverse),
        "--color-overlay": hexToRgbChannels(palette.overlay),
      }),
    [palette],
  );

  return {
    palette,
    resolvedTheme,
    preference,
    themeVars,
    themeTokens,
  };
};
