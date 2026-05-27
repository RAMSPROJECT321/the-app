import * as SecureStore from "expo-secure-store";

const prefix = "aegisflow";
const legacyPrefix = `${prefix}:`;

const normalizeKey = (key: string) => {
  if (!key.trim()) {
    throw new Error("Secure storage key must not be empty.");
  }

  const encoded = Array.from(key)
    .map((character) => character.codePointAt(0)?.toString(16).padStart(4, "0") ?? "")
    .join("");

  return `${prefix}${encoded}`;
};

export const secureStorageService = {
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(normalizeKey(key), value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async getItem(key: string) {
    const normalizedKey = normalizeKey(key);
    const storedValue = await SecureStore.getItemAsync(normalizedKey);

    if (storedValue) {
      return storedValue;
    }

    try {
      return SecureStore.getItemAsync(`${legacyPrefix}${key}`);
    } catch {
      return null;
    }
  },
  async deleteItem(key: string) {
    await SecureStore.deleteItemAsync(normalizeKey(key));

    try {
      await SecureStore.deleteItemAsync(`${legacyPrefix}${key}`);
    } catch {
      // Ignore legacy key cleanup failures caused by unsupported characters.
    }
  },
  async setVaultSecret(secretRef: string, secret: string) {
    await this.setItem(`vault-secret:${secretRef}`, secret);
  },
  async getVaultSecret(secretRef: string) {
    return this.getItem(`vault-secret:${secretRef}`);
  },
  async deleteVaultSecret(secretRef: string) {
    await this.deleteItem(`vault-secret:${secretRef}`);
  },
};
