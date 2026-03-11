// app/(tabs)/chats.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/database';
import { Chat } from '../../src/database/models/Chat';
import { wsService } from '../../src/services/websocket';
import { useAuthStore } from '../../src/store/authStore';

// Компонент отдельного элемента списка чатов (вынесен для оптимизации ререндеров)
const ChatItem = ({ chat, onPress }: { chat: Chat; onPress: () => void }) => {
  // В реальном проекте тут также можно обернуть ChatItem в withObservables, 
  // чтобы он обновлял текст последнего сообщения при изменениях внутри связи messages
  const formattedDate = new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{chat.title?.charAt(0).toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle} numberOfLines={1}>{chat.title || 'Неизвестный чат'}</Text>
          <Text style={styles.chatTime}>{formattedDate}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={2}>
          Последнее сообщение появится здесь...
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Основной компонент списка
const ChatsScreen = ({ chats }: { chats: Chat[] }) => {
  const router = useRouter();
  const { logout } = useAuthStore();

  useEffect(() => {
    // Подключаем WebSocket при заходе в список чатов
    wsService.connect();

    return () => {
      // Опционально: не отключаем WS при переходе внутри приложения, отключаем только при logout
    };
  }, []);

  const handleLogout = async () => {
    wsService.disconnect();
    await logout();
  };

  const renderItem = ({ item }: { item: Chat }) => (
    <ChatItem 
      chat={item} 
      onPress={() => router.push(`/chat/${item.id}`)} 
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Акыл Чешме</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Выход</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={76} // Обязательный параметр для FlashList (высота элемента)
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>У вас пока нет чатов</Text>
          </View>
        }
      />
    </View>
  );
};

// HOC для реактивной привязки локальной БД к UI
// Экран будет моментально обновляться при любых изменениях в таблице 'chats'
const enhance = withObservables([], () => ({
  chats: database.get<Chat>('chats').query().observe(),
}));

export default enhance(ChatsScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FAFAFC',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  logoutText: { fontSize: 16, color: '#FF3B30' },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatTitle: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  chatTime: { fontSize: 13, color: '#8E8E93', marginLeft: 8 },
  lastMessage: { fontSize: 15, color: '#8E8E93' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#8E8E93', fontSize: 16 },
});