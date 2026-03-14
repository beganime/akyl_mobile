import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const API_BASE_URL = 'http://akyl-cheshmesi.ru/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const initApiClient = async () => {
  apiClient.defaults.baseURL = API_BASE_URL;
  return API_BASE_URL;
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
      await useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);
