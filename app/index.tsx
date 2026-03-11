// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { isLogged } = useAuthStore();
  
  // Жесткий редирект с корня приложения в зависимости от статуса
  if (isLogged) {
    return <Redirect href="/(tabs)/chats" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}