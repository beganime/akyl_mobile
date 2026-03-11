// app/(auth)/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import { database } from '../../src/database';
import { User } from '../../src/database/models/User';

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
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);

      // Запрос строго по доке: application/x-www-form-urlencoded
      const tokenResponse = await apiClient.post('/auth/login/access-token', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = tokenResponse.data;
      await setTokens(access_token, '');

      const meResponse = await apiClient.get('/users/me');
      const meData = meResponse.data;

      await database.write(async () => {
        const usersCollection = database.get<User>('users');
        await usersCollection.query().destroyAllPermanently();
        await usersCollection.create((user) => {
          user._raw.id = meData.id; 
          user.username = meData.username;
          user.avatarUrl = meData.avatar_url || '';
          user.isBot = meData.is_bot || false;
        });
      });

      router.replace('/(tabs)/chats');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Проверьте соединение с интернетом';
      Alert.alert('Ошибка', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
             {/* Загружаем логотип из assets */}
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.title}>Вход в Акыл Чешме</Text>
        <Text style={styles.subtitle}>Пожалуйста, введите ваш логин и пароль.</Text>

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Логин"
                placeholderTextColor="#64748B"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Пароль"
                placeholderTextColor="#64748B"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
              />
            </View>
          )}
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Продолжить</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
            <Text style={styles.linkText}>Нет аккаунта? Зарегистрируйтесь</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1426' }, // Темно-синий фон
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoCircle: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#13203B', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F97316' // Оранжевая обводка
  },
  logoImage: { width: 80, height: 80 },
  title: { fontSize: 26, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E9EAB', textAlign: 'center', marginBottom: 40 },
  inputWrapper: { marginBottom: 20 },
  input: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#2C3E50', 
    paddingVertical: 12, 
    fontSize: 18, 
    color: '#FFFFFF' 
  },
  inputError: { borderBottomColor: '#EF4444' },
  button: { backgroundColor: '#F97316', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  linkButton: { marginTop: 24, alignItems: 'center', padding: 10 },
  linkText: { color: '#F97316', fontSize: 16, fontWeight: '500' },
});