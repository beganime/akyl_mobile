// app/(auth)/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import { database } from '../../src/database';
import { User } from '../../src/database/models/User';

// FastAPI OAuth2 использует username вместо email по умолчанию
const loginSchema = z.object({
  username: z.string().min(1, 'Введите имя пользователя'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // 1. Формируем x-www-form-urlencoded для OAuth2
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);

      // 2. Отправляем запрос на получение токена
      const tokenResponse = await apiClient.post('/auth/login/access-token', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = tokenResponse.data;
      
      // Сохраняем токен в стор (пока без refresh, поэтому передаем пустую строку вторым параметром)
      await setTokens(access_token, '');

      // 3. Запрашиваем профиль текущего пользователя
      const meResponse = await apiClient.get('/users/me');
      const meData = meResponse.data;

      // 4. Сохраняем профиль локально в WatermelonDB
      await database.write(async () => {
        const usersCollection = database.get<User>('users');
        
        // Очищаем старых юзеров на всякий случай (чтобы в локальной БД был только один текущий профиль-владелец)
        await usersCollection.query().destroyAllPermanently();

        // Создаем запись. Важно: мы принудительно ставим _raw.id равным ID с бэкенда.
        await usersCollection.create((user) => {
          user._raw.id = meData.id; 
          user.username = meData.username;
          user.avatarUrl = meData.avatar_url || '';
          user.isBot = meData.is_bot || false;
        });
      });

      // Перекидываем пользователя в таб с чатами
      router.replace('/(tabs)/chats');

    } catch (error: any) {
      console.error('Ошибка входа:', error);
      const errorMsg = error.response?.data?.detail || 'Проверьте соединение с интернетом';
      Alert.alert('Ошибка авторизации', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Акыл Чешме</Text>
        <Text style={styles.subtitle}>Войдите в свой аккаунт</Text>

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Имя пользователя"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
              />
              {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Пароль"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>
          )}
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Войти</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
            <Text style={styles.linkText}>Нет аккаунта? Создать</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#007AFF', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40, marginTop: 8 },
  inputContainer: { marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, fontSize: 16, color: '#000' },
  inputError: { borderColor: '#FF3B30' },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 6, marginLeft: 4 },
  button: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center', padding: 10 },
  linkText: { color: '#007AFF', fontSize: 16, fontWeight: '500' },
});