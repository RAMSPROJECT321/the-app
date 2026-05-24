import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  type Theme,
} from "@react-navigation/native";

import type { AppPalette } from "@/theme";

export const createNavigationTheme = (
  palette: AppPalette,
  mode: "light" | "dark",
): Theme => ({
  ...(mode === "dark" ? NavigationDarkTheme : NavigationLightTheme),
  dark: mode === "dark",
  colors: {
    ...(mode === "dark" ? NavigationDarkTheme.colors : NavigationLightTheme.colors),
    background: palette.background,
    card: palette.surface,
    primary: palette.accent,
    border: palette.border,
    text: palette.textPrimary,
    notification: palette.accent,
  },
});
