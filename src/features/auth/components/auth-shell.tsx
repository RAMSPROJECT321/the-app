import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { APP_CONFIG } from "@/constants/app";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const AuthShell = ({
  title,
  description,
  children,
}: AuthShellProps) => (
  <Screen contentClassName="justify-center pb-16 pt-8">
    <Card className="overflow-hidden px-6 py-7">
      <View className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-accent/10" />
      <View className="absolute -bottom-16 left-10 h-28 w-28 rounded-full bg-vault/10" />
      <View className="gap-6">
        <View className="gap-2">
          <AppText variant="label" tone="accent">
            {APP_CONFIG.appName}
          </AppText>
          <AppText variant="hero">{title}</AppText>
          <AppText tone="secondary">{description}</AppText>
        </View>
        {children}
      </View>
    </Card>
  </Screen>
);
