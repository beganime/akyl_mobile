// src/api/client.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

export const determineServer = async () => {
  // Оба сервера с HTTPS. Пингуем /health без префиксов
  const tkmServer = { health: 'https://akyl-cheshmesi.online/health', api: 'https://akyl-cheshmesi.online/api/v1' };
  const ruServer = { health: 'https://akyl-cheshmesi.ru/health', api: 'https://akyl-cheshmesi.ru/api/v1' };

  try {
    console.log(`⏳ Пинг ТКМ сервера: ${tkmServer.health}`);
    // Ждем ровно 5 секунд отклика от ТКМ сервера
    await axios.get(tkmServer.health, { timeout: 5000 });
    apiClient.defaults.baseURL = tkmServer.api;
    console.log('✅ Подключено к ТКМ серверу:', tkmServer.api);
    return tkmServer.api;
  } catch (error) {
    console.log(`❌ ТКМ сервер недоступен (или CORS в вебе). Переключаемся на РФ...`);
    apiClient.defaults.baseURL = ruServer.api;
    return ruServer.api;
  }
};

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('Токен протух, выходим...');
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);