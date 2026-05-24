import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react-native";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { FlatList, View } from "react-native";

import { APP_MESSAGES } from "@/constants/app";
import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { SearchInput } from "@/components/search-input";
import { SectionHeader } from "@/components/section-header";
import { VaultCard } from "@/features/vault/components/vault-card";
import { biometricService } from "@/services/auth/biometric.service";
import { useSessionStore } from "@/store/session-store";
import { useVaultStore } from "@/store/vault-store";
import type { VaultCategory, VaultItem } from "@/types/entities";

const categories: Array<"all" | VaultCategory> = [
  "all",
  "password",
  "api_key",
  "link",
  "note",
  "secure_text",
];

export const VaultScreen = () => {
  const vaultUnlocked = useSessionStore((state) => state.vaultUnlocked);
  const unlockVault = useSessionStore((state) => state.unlockVault);
  const itemIds = useVaultStore((state) => state.itemIds);
  const itemsById = useVaultStore((state) => state.itemsById);
  const toggleFavorite = useVaultStore((state) => state.toggleFavorite);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<"all" | VaultCategory>("all");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const items = useMemo(
    () => itemIds.map((id) => itemsById[id]).filter(Boolean),
    [itemIds, itemsById],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return [...items]
      .sort((left, right) => {
        if (left.isFavorite === right.isFavorite) {
          return right.updatedAt.localeCompare(left.updatedAt);
        }

        return left.isFavorite ? -1 : 1;
      })
      .filter((item) => {
        const matchesQuery = normalizedQuery
          ? `${item.title} ${item.notes ?? ""} ${item.category}`.toLowerCase().includes(normalizedQuery)
          : true;
        const matchesCategory = category === "all" ? true : item.category === category;
        return matchesQuery && matchesCategory;
      });
  }, [category, deferredSearchQuery, items]);

  const handleUnlock = async () => {
    const success = await biometricService.authenticateAsync();

    if (success) {
      unlockVault();
    }
  };

  const renderVaultItem = useCallback(
    ({ item }: { item: VaultItem }) => (
      <VaultCard item={item} onToggleFavorite={() => toggleFavorite(item.id)} />
    ),
    [toggleFavorite],
  );

  if (!vaultUnlocked) {
    return (
      <Screen>
        <Card className="gap-6 px-6 py-7">
          <View className="h-14 w-14 items-center justify-center rounded-3xl bg-vault/10">
            <LockKeyhole color="#0F766E" size={24} strokeWidth={2.2} />
          </View>
          <View className="gap-2">
            <AppText variant="title">Vault locked</AppText>
            <AppText tone="secondary">
              Secure entries stay hidden until a biometric check passes on this device.
            </AppText>
            <AppText variant="caption" tone="tertiary">
              {APP_MESSAGES.missingAppsScript}
            </AppText>
          </View>
          <AppButton label="Unlock vault" onPress={() => void handleUnlock()} icon={ShieldCheck} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} contentClassName="pb-0">
      <View className="gap-6 px-5 pb-4 pt-6">
        <SectionHeader
          eyebrow="Secure local storage"
          title="Vault"
          description="Passwords, API keys, URLs, and private notes stay behind the device lock."
        />

        <Card className="gap-4">
          <SearchInput
            placeholder="Search credentials, notes, and categories"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View className="flex-row flex-wrap gap-2">
            {categories.map((filter) => (
              <Chip
                key={filter}
                label={filter.replace("_", " ")}
                selected={category === filter}
                onPress={() => setCategory(filter)}
              />
            ))}
          </View>
          <View className="rounded-3xl bg-background-muted px-4 py-4">
            <View className="flex-row items-center gap-3">
              <KeyRound color="#0F766E" size={18} strokeWidth={2.2} />
              <View className="flex-1 gap-1">
                <AppText variant="bodyStrong">Local-first protection</AppText>
                <AppText variant="caption" tone="secondary">
                  Secrets are stored in device secure storage. Vault sync remains local until encrypted sync is defined.
                </AppText>
              </View>
            </View>
          </View>
        </Card>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderVaultItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-4 px-5 pb-32"
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            icon={ShieldCheck}
            title="No secure entries match"
            description="Change the search or category filter, or add a new vault entry from the store action layer."
          />
        }
      />
    </Screen>
  );
};
