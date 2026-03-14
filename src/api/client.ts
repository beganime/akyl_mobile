import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const SERVERS = [
  {
    health: 'https://akyl-cheshmesi.online/health',
    api: 'https://akyl-cheshmesi.online/api/v1',
  },
  {
    health: 'https://akyl-cheshmesi.ru/health',
    api: 'https://akyl-cheshmesi.ru/api/v1',
  },
] as const;

export const DEFAULT_API_BASE_URL = SERVERS[1].api;

let activeApiBaseUrl: string = DEFAULT_API_BASE_URL;

export const getActiveApiBaseUrl = () => activeApiBaseUrl;

export const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const determineServer = async () => {
  for (const server of SERVERS) {
    try {
      await axios.get(server.health, { timeout: 5000 });
      activeApiBaseUrl = server.api;
      apiClient.defaults.baseURL = server.api;
      return server.api;
    } catch {
      // try next server
    }
  }

  activeApiBaseUrl = DEFAULT_API_BASE_URL;
  apiClient.defaults.baseURL = DEFAULT_API_BASE_URL;
  return DEFAULT_API_BASE_URL;
};

export const initApiClient = async () => determineServer();

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
