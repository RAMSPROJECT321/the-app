import * as SecureStore from "expo-secure-store";

const prefix = "aegisflow";

export const secureStorageService = {
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(`${prefix}:${key}`, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async getItem(key: string) {
    return SecureStore.getItemAsync(`${prefix}:${key}`);
  },
  async deleteItem(key: string) {
    await SecureStore.deleteItemAsync(`${prefix}:${key}`);
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
