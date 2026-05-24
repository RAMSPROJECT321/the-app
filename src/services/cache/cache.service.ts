import AsyncStorage from "@react-native-async-storage/async-storage";

export const cacheService = {
  async getJson<T>(key: string) {
    const raw = await AsyncStorage.getItem(key);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  },
  async setJson<T>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
};
