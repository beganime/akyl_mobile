// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen 
        name="chats" 
        options={{ title: 'Чаты' }} 
      />
    </Tabs>
  );
}