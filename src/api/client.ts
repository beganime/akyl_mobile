// src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерсептор запросов: добавляем access_token
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Интерсептор ответов: обрабатываем ошибку 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Если токен протух или невалиден
    if (error.response?.status === 401) {
      console.log('Токен недействителен, выполняем выход...');
      // Разлогиниваем юзера, перекинет на экран Login через Route Guard
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);