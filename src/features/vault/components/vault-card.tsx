import { Heart, Link2, PencilLine, ShieldCheck } from "lucide-react-native";
import { memo } from "react";
import { View } from "react-native";

import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { IconButton } from "@/components/icon-button";
import { SecretField } from "@/features/vault/components/secret-field";
import type { VaultItem } from "@/types/entities";
import { formatRelativeTime } from "@/utils/date";

interface VaultCardProps {
  item: VaultItem;
  onToggleFavorite: () => void;
  onOpen: () => void;
}

export const VaultCard = memo(({ item, onToggleFavorite, onOpen }: VaultCardProps) => (
  <Card className="gap-4 px-5 py-5">
    <View className="flex-row items-start justify-between gap-4">
      <View className="flex-1 gap-2">
        <View className="flex-row items-center gap-2">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-vault/10">
            <ShieldCheck color="#0F766E" size={18} strokeWidth={2.2} />
          </View>
          <View className="flex-1 gap-0.5">
            <AppText variant="subtitle">{item.title}</AppText>
            <AppText variant="caption" tone="secondary">
              {item.category.replace("_", " ")}
            </AppText>
          </View>
        </View>
        {item.notes ? (
          <AppText tone="secondary" numberOfLines={2}>
            {item.notes}
          </AppText>
        ) : null}
      </View>
      <View className="flex-row gap-2">
        <IconButton icon={PencilLine} onPress={onOpen} />
        <IconButton
          icon={Heart}
          onPress={onToggleFavorite}
          tone={item.isFavorite ? "accent" : "default"}
        />
      </View>
    </View>

    {item.url ? (
      <View className="flex-row items-center gap-2 rounded-2xl bg-background-muted px-4 py-3">
        <Link2 color="#475569" size={15} strokeWidth={2.1} />
        <AppText variant="caption" tone="secondary" numberOfLines={1} className="flex-1">
          {item.url}
        </AppText>
      </View>
    ) : null}

    <SecretField
      label={item.username ? `Secret for ${item.username}` : "Protected value"}
      secretRef={item.secretRef}
      maskedValue={item.secretPreview}
    />

    <View className="flex-row items-center justify-between gap-4">
      <AppText variant="caption" tone="secondary">
        {item.syncMode === "local_only_secure" ? "Stored locally" : "Metadata synced"}
      </AppText>
      <AppText variant="caption" tone="tertiary">
        Updated {formatRelativeTime(item.updatedAt)}
      </AppText>
    </View>
  </Card>
));

VaultCard.displayName = "VaultCard";
