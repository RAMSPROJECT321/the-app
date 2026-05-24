import { memo } from "react";
import { Text, type TextProps } from "react-native";

import { cn } from "@/utils/cn";

type AppTextVariant =
  | "hero"
  | "title"
  | "subtitle"
  | "body"
  | "bodyStrong"
  | "caption"
  | "label";

type AppTextTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "inverse"
  | "accent"
  | "success"
  | "warning"
  | "danger";

const variantClassMap: Record<AppTextVariant, string> = {
  hero: "font-display text-3xl leading-9 tracking-tight",
  title: "font-display text-xl leading-7 tracking-tight",
  subtitle: "font-body text-base font-semibold leading-6",
  body: "font-body text-sm leading-6",
  bodyStrong: "font-body text-sm font-semibold leading-6",
  caption: "font-body text-xs leading-5",
  label: "font-body text-[11px] font-semibold uppercase tracking-[0.18em]",
};

const toneClassMap: Record<AppTextTone, string> = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  tertiary: "text-text-tertiary",
  inverse: "text-text-inverse",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  tone?: AppTextTone;
}

export const AppText = memo(
  ({
    className,
    variant = "body",
    tone = "primary",
    children,
    ...rest
  }: AppTextProps) => (
    <Text
      className={cn(variantClassMap[variant], toneClassMap[tone], className)}
      {...rest}
    >
      {children}
    </Text>
  ),
);

AppText.displayName = "AppText";
