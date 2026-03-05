import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function ChatsScreen() {
  const { logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Добро пожаловать в Акыл Чешме!</Text>
      <Text style={styles.subtext}>Здесь будет список чатов из WatermelonDB</Text>
      
      {/* Кнопка для теста выхода из аккаунта */}
      <Button title="Выйти" onPress={logout} color="#FF3B30" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
  subtext: { fontSize: 14, color: '#666', marginTop: 8, marginBottom: 24 },
});