import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createId } from "@/utils/id";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionState {
  hydrated: boolean;
  authResolved: boolean;
  authStatus: AuthStatus;
  userId?: string;
  email?: string;
  deviceId: string;
  vaultUnlocked: boolean;
  lastUnlockedAt?: string;
  setHydrated: (hydrated: boolean) => void;
  setAuthResolved: () => void;
  setAuthenticatedUser: (user: { userId: string; email: string }) => void;
  clearAuthenticatedUser: () => void;
  ensureDeviceId: () => string;
  unlockVault: () => void;
  lockVault: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      authResolved: false,
      authStatus: "loading",
      userId: undefined,
      email: undefined,
      deviceId: "",
      vaultUnlocked: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setAuthResolved: () =>
        set((state) => ({
          authResolved: true,
          authStatus:
            state.authStatus === "loading" ? "unauthenticated" : state.authStatus,
        })),
      setAuthenticatedUser: ({ userId, email }) =>
        set({
          authResolved: true,
          authStatus: "authenticated",
          userId,
          email,
        }),
      clearAuthenticatedUser: () =>
        set({
          authResolved: true,
          authStatus: "unauthenticated",
          userId: undefined,
          email: undefined,
          vaultUnlocked: false,
          lastUnlockedAt: undefined,
        }),
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
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        deviceId: state.deviceId,
      }),
    },
  ),
);
