import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

// Инициализируем MMKV для синхронного и невероятно быстрого хранилища
export const storage = new MMKV();

interface AppState {
  theme: 'light' | 'dark';
  language: 'ru' | 'en';
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'ru' | 'en') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Читаем из MMKV, если пусто — дефолтные значения
  theme: (storage.getString('theme') as 'light' | 'dark') || 'light',
  language: (storage.getString('language') as 'ru' | 'en') || 'ru',

  setTheme: (theme) => {
    storage.set('theme', theme);
    set({ theme });
  },
  setLanguage: (language) => {
    storage.set('language', language);
    set({ language });
  },
}));