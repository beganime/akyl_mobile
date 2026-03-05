import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  accessToken: string | null;
  isLogged: boolean;
  setTokens: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null, // Храним только в памяти для безопасности
  isLogged: false,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync('refresh_token', refresh);
    set({ accessToken: access, isLogged: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('refresh_token');
    set({ accessToken: null, isLogged: false });
  },
}));