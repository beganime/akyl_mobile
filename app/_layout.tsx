import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen 
        name="chats" 
        options={{ 
          title: 'Чаты',
          // Здесь позже добавим иконки
        }} 
      />
    </Tabs>
  );
}