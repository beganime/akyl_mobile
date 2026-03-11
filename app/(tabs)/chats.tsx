// app/(tabs)/chats.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import withObservables from '@nozbe/with-observables';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../src/database';
import { Chat } from '../../src/database/models/Chat';
import { wsService } from '../../src/services/websocket';
import { syncChats } from '../../src/services/syncService';

const ChatItem = ({ chat, onPress }: { chat: Chat; onPress: () => void }) => {
  const formattedDate = new Date(chat.lastMessageAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
          Последнее сообщение...
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ChatsScreen = ({ chats }: { chats: Chat[] }) => {
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    wsService.connect();
    syncChats(); 
  }, []);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const renderItem = ({ item }: { item: Chat }) => (
    <ChatItem chat={item} onPress={() => router.push(`/chat/${item.id}`)} />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuIcon}>
            <Ionicons name="menu" size={30} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Акыл Чешме</Text>
          <View style={styles.menuIcon} />
        </View>
      </SafeAreaView>

      <FlashList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={76}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>У вас пока нет диалогов</Text>
          </View>
        }
      />
    </View>
  );
};

const enhance = withObservables([], () => ({
  chats: database.get<Chat>('chats').query().observe(),
}));

export default enhance(ChatsScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1426' },
  headerSafeArea: { backgroundColor: '#13203B', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#13203B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  menuIcon: { width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B', // Темный разделитель
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#F97316', fontSize: 22, fontWeight: '600' }, // Оранжевая буква
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatTitle: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  chatTime: { fontSize: 13, color: '#8E9EAB', marginLeft: 8 },
  lastMessage: { fontSize: 15, color: '#8E9EAB' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 150 },
  emptyText: { color: '#8E9EAB', fontSize: 16 },
});