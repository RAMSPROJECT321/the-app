import { create } from "zustand";

interface ConnectivityState {
  isConnected: boolean;
  setConnected: (isConnected: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isConnected: false,
  setConnected: (isConnected) => set({ isConnected }),
}));
