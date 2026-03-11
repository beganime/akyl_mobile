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
      await apiClient.post('/users/register', {
        username: data.username,
        password: data.password,
        name: data.name,
      });

      Alert.alert('Успешно', 'Аккаунт создан! Теперь вы можете войти.', [
        { text: 'ОК', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Ошибка при соединении с сервером';
      Alert.alert('Ошибка', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>Создайте новый аккаунт</Text>

        <Controller control={control} name="username" render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputWrapper}>
            <TextInput style={[styles.input, errors.username && styles.inputError]} placeholder="Логин (без пробелов)" placeholderTextColor="#64748B" onBlur={onBlur} onChangeText={onChange} value={value} autoCapitalize="none" />
          </View>
        )} />

        <Controller control={control} name="name" render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputWrapper}>
            <TextInput style={[styles.input, errors.name && styles.inputError]} placeholder="Ваше Имя" placeholderTextColor="#64748B" onBlur={onBlur} onChangeText={onChange} value={value} />
          </View>
        )} />

        <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputWrapper}>
            <TextInput style={[styles.input, errors.password && styles.inputError]} placeholder="Пароль" placeholderTextColor="#64748B" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry />
          </View>
        )} />

        <Controller control={control} name="confirmPassword" render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputWrapper}>
            <TextInput style={[styles.input, errors.confirmPassword && styles.inputError]} placeholder="Повторите пароль" placeholderTextColor="#64748B" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry />
          </View>
        )} />

        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit(onSubmit)} disabled={isLoading} activeOpacity={0.8}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Создать аккаунт</Text>}
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
  container: { flex: 1, backgroundColor: '#0B1426' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#8E9EAB', textAlign: 'center', marginBottom: 40 },
  inputWrapper: { marginBottom: 20 },
  input: { borderBottomWidth: 1, borderBottomColor: '#2C3E50', paddingVertical: 12, fontSize: 18, color: '#FFFFFF' },
  inputError: { borderBottomColor: '#EF4444' },
  button: { backgroundColor: '#F97316', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  linkButton: { marginTop: 24, alignItems: 'center', padding: 10 },
  linkText: { color: '#F97316', fontSize: 16, fontWeight: '500' },
});