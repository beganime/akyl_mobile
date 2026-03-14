// app/_layout.tsx
import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { initApiClient } from '../src/api/client';

export default function RootLayout() {
  const { isLogged, isInitialized, initAuth } = useAuthStore();
  const [isServerReady, setIsServerReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // 1. Инициализация (Выбор сервера + Проверка токенов)
  useEffect(() => {
    const bootstrap = async () => {
      await initApiClient();
      setIsServerReady(true);
      await initAuth();
    };
    bootstrap();
  }, []);

  // 2. Route Guard (Защита роутов)
  useEffect(() => {
    if (!isInitialized || !isServerReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Даем роутеру 100мс на монтирование перед редиректом (лечит баги Expo Router)
    setTimeout(() => {
      if (!isLogged && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (isLogged && inAuthGroup) {
        router.replace('/(tabs)/chats');
      }
    }, 100);
  }, [isLogged, isInitialized, isServerReady, segments]);

  // Загрузочный экран (Темно-синий)
  if (!isInitialized || !isServerReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1426' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}