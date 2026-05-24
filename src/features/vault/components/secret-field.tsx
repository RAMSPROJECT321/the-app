import { Copy, Eye, EyeOff } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/app-text";
import { IconButton } from "@/components/icon-button";
import { secureStorageService } from "@/services/secure/secure-storage.service";

interface SecretFieldProps {
  label: string;
  secretRef: string;
  maskedValue: string;
}

export const SecretField = ({
  label,
  secretRef,
  maskedValue,
}: SecretFieldProps) => {
  const [revealedValue, setRevealedValue] = useState<string | null>(null);

  const handleToggleReveal = async () => {
    if (revealedValue) {
      setRevealedValue(null);
      return;
    }

    const secret = await secureStorageService.getVaultSecret(secretRef);
    setRevealedValue(secret ?? "Unavailable");
  };

  const handleCopy = async () => {
    const secret = await secureStorageService.getVaultSecret(secretRef);

    if (!secret) {
      return;
    }

    await Clipboard.setStringAsync(secret);
    await Haptics.selectionAsync();
  };

  return (
    <View className="gap-3 rounded-3xl border border-border bg-surface-elevated px-4 py-4">
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="caption" tone="secondary">
          {label}
        </AppText>
        <View className="flex-row gap-2">
          <IconButton
            icon={revealedValue ? EyeOff : Eye}
            onPress={() => void handleToggleReveal()}
          />
          <IconButton icon={Copy} onPress={() => void handleCopy()} />
        </View>
      </View>
      <Pressable onPress={() => void handleToggleReveal()}>
        <AppText variant="bodyStrong" className="tracking-[0.16em]">
          {revealedValue ?? maskedValue}
        </AppText>
      </Pressable>
    </View>
  );
};
