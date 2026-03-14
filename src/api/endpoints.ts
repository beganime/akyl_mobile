import { apiClient } from './client';

export interface UserDto {
  id: string;
  username: string;
  is_bot: boolean;
  name: string;
  avatar_url: string | null;
}

export interface ChatDto {
  id: string;
  type: 'dialog' | 'group';
  updated_at: string;
}

export interface MessageDto {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export const authApi = {
  register: (payload: { username: string; password: string; name: string }) =>
    apiClient.post<UserDto>('/users/register', payload),

  login: (payload: { username: string; password: string }) => {
    const formData = new URLSearchParams();
    formData.append('username', payload.username);
    formData.append('password', payload.password);

    return apiClient.post<{ access_token: string; token_type: string }>(
      '/auth/login/access-token',
      formData.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
  },

  me: () => apiClient.get<UserDto>('/users/me'),

  updateMe: (payload: { name?: string; avatar_url?: string }) =>
    apiClient.put<UserDto>('/users/me', payload),
};

export const chatsApi = {
  createDialog: (target_user_id: string) =>
    apiClient.post<ChatDto>('/chats/', { type: 'dialog', target_user_id }),

  list: (skip = 0, limit = 20) =>
    apiClient.get<ChatDto[]>('/chats/', { params: { skip, limit } }),

  messages: (chatId: string, skip = 0, limit = 50) =>
    apiClient.get<MessageDto[]>(`/chats/${chatId}/messages`, { params: { skip, limit } }),
};

export const storageApi = {
  getPresignedUrl: (filename: string) =>
    apiClient.get<{ upload_url: string; file_url: string }>('/storage/presigned-url', {
      params: { filename },
    }),
};

export const devicesApi = {
  register: (payload: { push_token: string; device_name: string; location?: string }) =>
    apiClient.post('/devices/', payload),
  list: () => apiClient.get('/devices/'),
};

export const searchApi = {
  global: (q: string) => apiClient.get<UserDto[]>('/search/', { params: { q } }),
};
