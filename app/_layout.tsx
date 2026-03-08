import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const { isLogged } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Защита роутов (Route Guard): следим за состоянием авторизации
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isLogged && !inAuthGroup) {
      // Если не авторизован и пытается зайти не в auth — кидаем на логин
      router.replace('/(auth)/login');
    } else if (isLogged && inAuthGroup) {
      // Если авторизован и находится на экранах входа — кидаем в чаты
      router.replace('/(tabs)/chats');
    }
  }, [isLogged, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}