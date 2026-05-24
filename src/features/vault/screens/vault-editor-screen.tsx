import { ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { TextField } from "@/components/text-field";
import { APP_MESSAGES } from "@/constants/app";
import { secureStorageService } from "@/services/secure/secure-storage.service";
import { useSessionStore } from "@/store/session-store";
import { useVaultStore } from "@/store/vault-store";
import type { VaultCategory } from "@/types/entities";
import type { VaultStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<VaultStackParamList, "VaultEditor">;

const categories: VaultCategory[] = [
  "password",
  "api_key",
  "link",
  "note",
  "secure_text",
];

export const VaultEditorScreen = ({ navigation, route }: Props) => {
  const { itemId } = route.params ?? {};
  const userId = useSessionStore((state) => state.userId);
  const item = useVaultStore((state) => {
    if (!itemId) {
      return undefined;
    }

    const nextItem = state.itemsById[itemId];
    return nextItem?.userId === userId ? nextItem : undefined;
  });
  const saveVaultItemAsync = useVaultStore((state) => state.saveVaultItemAsync);
  const deleteVaultItemAsync = useVaultStore((state) => state.deleteVaultItemAsync);
  const [title, setTitle] = useState(item?.title ?? "");
  const [category, setCategory] = useState<VaultCategory>(item?.category ?? "password");
  const [username, setUsername] = useState(item?.username ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [secret, setSecret] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secretLoading, setSecretLoading] = useState(Boolean(itemId));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!item) {
      setSecretLoading(false);
      return;
    }

    setTitle(item.title);
    setCategory(item.category);
    setUsername(item.username ?? "");
    setUrl(item.url ?? "");
    setNotes(item.notes ?? "");

    let active = true;

    const loadSecretAsync = async () => {
      const storedSecret = await secureStorageService.getVaultSecret(item.secretRef);

      if (!active) {
        return;
      }

      setSecret(storedSecret ?? "");
      setSecretLoading(false);

      if (!storedSecret) {
        setErrorMessage(APP_MESSAGES.vaultSecretUnavailable);
      }
    };

    void loadSecretAsync();

    return () => {
      active = false;
    };
  }, [item]);

  if (itemId && !item && !secretLoading) {
    return (
      <Screen>
        <EmptyState
          icon={ShieldCheck}
          title="Vault entry not found"
          description="This item may have been removed from the current account."
          actionLabel="Back to vault"
          onActionPress={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMessage("Add a title for this secure entry.");
      return;
    }

    if (!secret.trim()) {
      setErrorMessage("Add the secret value to store it securely on this device.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      await saveVaultItemAsync(
        {
          title: title.trim(),
          category,
          username: username.trim() || undefined,
          url: url.trim() || undefined,
          notes: notes.trim() || undefined,
          secret: secret.trim(),
          syncMode: "metadata_synced",
          isFavorite: item?.isFavorite ?? false,
        },
        itemId,
      );
      navigation.goBack();
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "Unable to save this vault entry.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!itemId) {
      return;
    }

    Alert.alert("Delete entry", "This removes the metadata and local secret from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setDeleting(true);
            await deleteVaultItemAsync(itemId);
            setDeleting(false);
            navigation.goBack();
          })();
        },
      },
    ]);
  };

  return (
    <Screen>
      <SectionHeader
        eyebrow="Secure metadata sync"
        title={itemId ? "Edit vault entry" : "Create vault entry"}
        description="Vault metadata syncs with Firestore. The secret value stays protected in local secure storage."
      />

      <Card className="gap-4">
        <TextField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="GitHub access token"
        />
        <TextField
          label="Username or label"
          value={username}
          onChangeText={setUsername}
          placeholder="Optional"
        />
        <TextField
          label="URL"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://..."
        />
        <TextField
          label="Secret"
          value={secret}
          onChangeText={setSecret}
          secureTextEntry
          placeholder={secretLoading ? "Loading local secret..." : "Paste the secret value"}
        />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Add usage notes, rotation reminders, or recovery details"
        />

        <View className="gap-3">
          <AppText variant="caption" tone="secondary">
            Category
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((value) => (
              <Chip
                key={value}
                label={value.replace("_", " ")}
                selected={category === value}
                onPress={() => setCategory(value)}
              />
            ))}
          </View>
        </View>

        {errorMessage ? <AppText tone="danger">{errorMessage}</AppText> : null}

        <View className="gap-3">
          <AppButton
            label={itemId ? "Save changes" : "Create entry"}
            onPress={() => void handleSave()}
            loading={saving}
            disabled={secretLoading}
          />
          {itemId ? (
            <AppButton
              label="Delete entry"
              onPress={handleDelete}
              variant="danger"
              loading={deleting}
            />
          ) : null}
        </View>
      </Card>
    </Screen>
  );
};
