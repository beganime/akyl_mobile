// app/(auth)/register.tsx
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, Link } from 'expo-router';

// Схема валидации (проверка совпадения паролей по ТЗ)
const registerSchema = z.object({
  username: z.string().min(3, 'Минимум 3 символа'),
  email: z.string().email('Неверный формат email'),
  password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    // TODO: Запрос на сервер регистрации
    console.log('Регистрация:', data);
    // Возвращаем на экран входа
    router.replace('/(auth)/login');
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
              <TextInput style={[styles.input, errors.username && styles.inputError]} placeholder="Имя пользователя" onBlur={onBlur} onChangeText={onChange} value={value} autoCapitalize="none" />
              {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="Email" onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="email-address" autoCapitalize="none" />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
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

        <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.buttonText}>Создать аккаунт</Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkButton}>
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
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center', padding: 10 },
  linkText: { color: '#007AFF', fontSize: 16, fontWeight: '500' },
});