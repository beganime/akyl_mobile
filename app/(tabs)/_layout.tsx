// app/(tabs)/_layout.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { wsService } from '../../src/services/websocket';

function CustomDrawerContent(props: any) {
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    wsService.disconnect();
    await logout();
  };

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>АЧ</Text>
        </View>
        <View>
          <Text style={styles.userName}>Студент</Text>
          <Text style={styles.userPhone}>Акыл Чешме</Text>
        </View>
      </View>

      <View style={styles.drawerItems}>
        <TouchableOpacity style={styles.drawerItem}>
          <Ionicons name="people-outline" size={26} color="#8E9EAB" />
          <Text style={styles.drawerItemText}>Контакты</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <Ionicons name="settings-outline" size={26} color="#8E9EAB" />
          <Text style={styles.drawerItemText}>Настройки</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#EF4444" />
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { width: '80%', backgroundColor: '#0B1426' }, // Темный фон шторки
          drawerType: 'front',
        }}
      >
        <Drawer.Screen name="chats" />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: '#0B1426', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  drawerHeader: {
    padding: 20,
    backgroundColor: '#13203B', 
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F97316', // Оранжевая аватарка профиля
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  userName: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  userPhone: { color: '#8E9EAB', fontSize: 14, marginTop: 4 },
  drawerItems: { flex: 1, paddingHorizontal: 10 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10 },
  drawerItemText: { fontSize: 16, color: '#FFFFFF', marginLeft: 20, fontWeight: '500' },
  footer: { borderTopWidth: 1, borderTopColor: '#1E293B', padding: 10 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10 },
  logoutText: { fontSize: 16, color: '#EF4444', marginLeft: 20, fontWeight: '500' },
});