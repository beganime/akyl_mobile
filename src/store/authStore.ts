// src/store/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface AuthState {
  accessToken: string | null;
  isLogged: boolean;
  isInitialized: boolean;
  setTokens: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

// Кроссплатформенная обертка для хранилища (чтобы не падало на Web)
const storage = {
  setItemAsync: async (key: string, value: string) => {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  getItemAsync: async (key: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  deleteItemAsync: async (key: string) => {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isLogged: false,
  isInitialized: false,

  setTokens: async (access, refresh) => {
    await storage.setItemAsync('access_token', access);
    await storage.setItemAsync('refresh_token', refresh);
    set({ accessToken: access, isLogged: true });
  },

  logout: async () => {
    await storage.deleteItemAsync('access_token');
    await storage.deleteItemAsync('refresh_token');
    set({ accessToken: null, isLogged: false });
  },

  initAuth: async () => {
    try {
      const access = await storage.getItemAsync('access_token');
      if (access) {
        set({ accessToken: access, isLogged: true });
      }
    } catch (e) {
      console.error("Ошибка инициализации Auth:", e);
    } finally {
      set({ isInitialized: true });
    }
  },
}));