import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  isLogged: boolean;
  isInitialized: boolean;
  setTokens: (access: string) => Promise<void>;
  setUserId: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

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
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  isLogged: false,
  isInitialized: false,

  setTokens: async (access) => {
    await storage.setItemAsync('access_token', access);
    set({ accessToken: access, isLogged: true });
  },

  setUserId: async (userId) => {
    await storage.setItemAsync('user_id', userId);
    set({ userId });
  },

  logout: async () => {
    await storage.deleteItemAsync('access_token');
    await storage.deleteItemAsync('user_id');
    set({ accessToken: null, userId: null, isLogged: false });
  },

  initAuth: async () => {
    try {
      const access = await storage.getItemAsync('access_token');
      const userId = await storage.getItemAsync('user_id');
      if (access) {
        set({ accessToken: access, userId, isLogged: true });
      }
    } catch (e) {
      console.error('Ошибка инициализации Auth:', e);
    } finally {
      set({ isInitialized: true });
    }
  },
}));
