import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import withObservables from '@nozbe/with-observables';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { database } from '../../src/database';
import { Chat } from '../../src/database/models/Chat';
import { wsService } from '../../src/services/websocket';
import { syncChats } from '../../src/services/syncService';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ChatItem = ({ chat, onPress, index }: { chat: Chat; onPress: () => void; index: number }) => {
  const formattedDate = new Date(chat.lastMessageAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AnimatedTouchable
      entering={FadeInDown.duration(280).delay(Math.min(index * 40, 360))}
      style={styles.chatItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{chat.title?.charAt(0).toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {chat.title || 'Неизвестный чат'}
          </Text>
          <Text style={styles.chatTime}>{formattedDate}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          Откройте чат для продолжения диалога
        </Text>
      </View>
    </AnimatedTouchable>
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea}>
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuIcon}>
            <Ionicons name="menu" size={30} color="#f8fafc" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Акыл Чешме</Text>
            <Text style={styles.headerSubtitle}>Ваши диалоги</Text>
          </View>
          <View style={styles.menuIcon} />
        </Animated.View>
      </SafeAreaView>

      <FlashList
        data={chats}
        renderItem={({ item, index }) => (
          <ChatItem chat={item} index={index} onPress={() => router.push(`/chat/${item.id}`)} />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={42} color="#334155" />
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
  container: { flex: 1, backgroundColor: '#020617' },
  headerSafeArea: { backgroundColor: '#0b1220', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0b1220',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  menuIcon: { width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  headerSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  chatItem: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#f97316', fontSize: 20, fontWeight: '700' },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  chatTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc', flex: 1 },
  chatTime: { fontSize: 12, color: '#94a3b8', marginLeft: 8 },
  lastMessage: { fontSize: 14, color: '#64748b' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 160, gap: 8 },
  emptyText: { color: '#94a3b8', fontSize: 16 },
});
