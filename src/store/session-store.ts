import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { APP_CONFIG } from "@/constants/app";
import { createId } from "@/utils/id";

interface SessionState {
  userId: string;
  deviceId: string;
  vaultUnlocked: boolean;
  lastUnlockedAt?: string;
  ensureDeviceId: () => string;
  unlockVault: () => void;
  lockVault: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      userId: APP_CONFIG.appUserId,
      deviceId: "",
      vaultUnlocked: false,
      ensureDeviceId: () => {
        const existing = get().deviceId;

        if (existing) {
          return existing;
        }

        const nextId = createId("device");
        set({ deviceId: nextId });
        return nextId;
      },
      unlockVault: () =>
        set({
          vaultUnlocked: true,
          lastUnlockedAt: new Date().toISOString(),
        }),
      lockVault: () =>
        set({
          vaultUnlocked: false,
        }),
    }),
    {
      name: "session-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        deviceId: state.deviceId,
      }),
    },
  ),
);
