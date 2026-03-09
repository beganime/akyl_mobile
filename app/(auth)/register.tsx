// app/(auth)/register.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, Link } from 'expo-router';
import { apiClient } from '../../src/api/client';

const registerSchema = z.object({
  username: z.string().min(3, 'Минимум 3 символа').regex(/^[a-zA-Z0-9_]+$/, 'Только латинские буквы, цифры и _'),
  name: z.string().min(1, 'Введите ваше имя'),
  password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // Бэкенд схема UserCreate требует: username, password и опционально name
      await apiClient.post('/users/register', {
        username: data.username,
        password: data.password,
        name: data.name,
      });

      Alert.alert('Успешно', 'Аккаунт создан! Теперь вы можете войти.', [
        { text: 'ОК', onPress: () => router.replace('/(auth)/login') }
      ]);
      
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      const errorMsg = error.response?.data?.detail || 'Ошибка при соединении с сервером';
      Alert.alert('Ошибка', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>Присоединяйтесь к экосистеме</Text>

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput style={[styles.input, errors.username && styles.inputError]} placeholder="Имя пользователя (никнейм)" onBlur={onBlur} onChangeText={onChange} value={value} autoCapitalize="none" />
              {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput style={[styles.input, errors.name && styles.inputError]} placeholder="Ваше настоящее имя" onBlur={onBlur} onChangeText={onChange} value={value} />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput style={[styles.input, errors.password && styles.inputError]} placeholder="Пароль" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput style={[styles.input, errors.confirmPassword && styles.inputError]} placeholder="Повторите пароль" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
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
            <Text style={styles.buttonText}>Создать аккаунт</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
            <Text style={styles.linkText}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000', textAlign: 'left' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'left', marginBottom: 32, marginTop: 8 },
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