const themeConfig = require("./theme.config.cjs");

const colorVar = (variableName) => `rgb(var(${variableName}) / <alpha-value>)`;

module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: colorVar("--color-background"),
        "background-muted": colorVar("--color-background-muted"),
        surface: colorVar("--color-surface"),
        "surface-elevated": colorVar("--color-surface-elevated"),
        "surface-strong": colorVar("--color-surface-strong"),
        border: colorVar("--color-border"),
        "border-strong": colorVar("--color-border-strong"),
        accent: colorVar("--color-accent"),
        "accent-soft": colorVar("--color-accent-soft"),
        success: colorVar("--color-success"),
        warning: colorVar("--color-warning"),
        danger: colorVar("--color-danger"),
        info: colorVar("--color-info"),
        vault: colorVar("--color-vault"),
        "text-primary": colorVar("--color-text-primary"),
        "text-secondary": colorVar("--color-text-secondary"),
        "text-tertiary": colorVar("--color-text-tertiary"),
        "text-inverse": colorVar("--color-text-inverse"),
        overlay: colorVar("--color-overlay"),
      },
      borderRadius: themeConfig.radius,
      spacing: themeConfig.spacing,
      fontFamily: {
        body: [themeConfig.typography.body],
        display: [themeConfig.typography.display],
      },
      boxShadow: {
        subtle: themeConfig.shadow.subtle,
        floating: themeConfig.shadow.floating,
      },
      backgroundImage: {
        "hero-glow":
          "linear-gradient(135deg, rgba(55, 120, 255, 0.16), rgba(6, 182, 212, 0.12), rgba(15, 23, 42, 0.02))",
      },
    },
  },
  plugins: [],
};
