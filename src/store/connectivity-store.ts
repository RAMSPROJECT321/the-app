import { create } from "zustand";

interface ConnectivityState {
  isConnected: boolean;
  setConnected: (isConnected: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isConnected: true,
  setConnected: (isConnected) => set({ isConnected }),
}));
