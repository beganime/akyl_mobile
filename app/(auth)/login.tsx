// app/(auth)/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import { database } from '../../src/database';
import { User } from '../../src/database/models/User';

const loginSchema = z.object({
  username: z.string().min(1, 'Логин обязателен'),
  password: z.string().min(4, 'Пароль слишком короткий'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Состояние для "глазка"
  
  // mode: 'onChange' включает проверку при каждом вводе символа (решение п.3)
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange', 
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);

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
      // Улучшенный отлов сетевых ошибок (п.4)
      const errorMsg = error.response?.data?.detail 
        || error.message 
        || 'Сервер недоступен. Проверьте интернет.';
      Alert.alert('Ошибка входа', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        
        <Animated.View entering={FadeInDown.duration(800)} style={styles.logoContainer}>
          <View style={styles.logoCircle}>
             {/* overflow: 'hidden' обрежет квадратные углы логотипа (п.2) */}
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(200)}>
          <Text style={styles.title}>Вход в Акыл Чешмеси</Text>
          <Text style={styles.subtitle}>Войдите для начала общения</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(400)}>
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
                {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrapper}>
                <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Пароль"
                    placeholderTextColor="#64748B"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showPassword} // Переключатель видимости
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#8E9EAB" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </View>
            )}
          />

          <TouchableOpacity 
            style={[styles.button, (!isValid || isLoading) && styles.buttonDisabled]} 
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Войти</Text>}
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
              <Text style={styles.linkText}>Нет аккаунта? Зарегистрируйтесь</Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1426' }, 
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoCircle: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#13203B', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F97316',
    overflow: 'hidden', // Скрывает углы картинки
  },
  logoImage: { width: '100%', height: '100%' }, // Растягиваем логотип на весь круг
  title: { fontSize: 26, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E9EAB', textAlign: 'center', marginBottom: 40 },
  inputWrapper: { marginBottom: 20 },
  input: { 
    borderBottomWidth: 1, borderBottomColor: '#2C3E50', 
    paddingVertical: 12, fontSize: 18, color: '#FFFFFF' 
  },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#2C3E50',
  },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 18, color: '#FFFFFF' },
  eyeIcon: { padding: 10 },
  inputError: { borderBottomColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 2 },
  button: { backgroundColor: '#F97316', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.5, backgroundColor: '#c25911' },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  linkButton: { marginTop: 24, alignItems: 'center', padding: 10 },
  linkText: { color: '#F97316', fontSize: 16, fontWeight: '500' },
});