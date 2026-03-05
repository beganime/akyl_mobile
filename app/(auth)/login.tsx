// app/(auth)/login.tsx
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

// Архитектура: Описываем схему валидации до компонента
const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    // TODO: Здесь будет реальный запрос через apiClient.
    // Пока эмулируем успешный вход для проверки Route Guard
    console.log('Попытка входа:', data);
    setTokens('fake_access_token', 'fake_refresh_token');
    
    // Перекидываем пользователя в таб с чатами
    router.replace('/(tabs)/chats');
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
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
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

        <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.buttonText}>Войти</Text>
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Нет аккаунта? Создать</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

// Выносим стили вниз для чистоты
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
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center', padding: 10 },
  linkText: { color: '#007AFF', fontSize: 16, fontWeight: '500' },
});