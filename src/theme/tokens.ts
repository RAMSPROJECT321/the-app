const themeConfig = require("../../theme.config.cjs") as ThemeTokenConfig;

type ColorScale = {
  background: string;
  backgroundMuted: string;
  surface: string;
  surfaceElevated: string;
  surfaceStrong: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  vault: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  overlay: string;
};

type ThemeTokenConfig = {
  colorModes: {
    light: ColorScale;
    dark: ColorScale;
  };
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadow: Record<string, string>;
  typography: {
    body: string;
    display: string;
  };
  fonts: Record<string, string>;
  motion: Record<string, number>;
};

export const themeTokens = themeConfig;
export const lightPalette = themeConfig.colorModes.light;
export const darkPalette = themeConfig.colorModes.dark;
export type AppPalette = typeof lightPalette;
