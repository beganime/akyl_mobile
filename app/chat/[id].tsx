import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { database } from '../../src/database';
import { Message } from '../../src/database/models/Message';
import { wsService } from '../../src/services/websocket';
import { syncChatMessages } from '../../src/services/syncService';
import { useAuthStore } from '../../src/store/authStore';

const generateLocalId = () => Math.random().toString(36).substring(2, 15);

const MessageBubble = ({ message, isMine }: { message: Message; isMine: boolean }) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View entering={FadeInDown.duration(220)} style={[styles.bubbleContainer, isMine ? styles.myBubble : styles.theirBubble]}>
      <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>{message.text}</Text>
      <View style={styles.metaData}>
        <Text style={[styles.timeText, isMine ? styles.myTime : styles.theirTime]}>{time}</Text>
        {isMine && (
          <Ionicons
            name={message.isRead ? 'checkmark-done' : 'time-outline'}
            size={14}
            color="rgba(255,255,255,0.8)"

            style={styles.pendingIcon}
          />
        )}
      </View>
    </Animated.View>
  );
};

const ChatRoom = ({ messages }: { messages: Message[] }) => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const { userId } = useAuthStore();

  useEffect(() => {
    if (chatId) {
      syncChatMessages(chatId);
    }
  }, [chatId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    const localId = generateLocalId();
    setInputText('');

    await database.write(async () => {
      const messagesCollection = database.get<Message>('messages');
      await messagesCollection.create((msg) => {
        msg._raw.id = localId;
        (msg._raw as any).chat_id = chatId;
        (msg._raw as any).user_id = userId || 'me';
        msg.text = textToSend;
        msg.createdAt = Date.now();
        msg.isRead = false;
      });

      const chatCollection = database.get('chats');
      try {
        const chat = await chatCollection.find(chatId);
        await chat.update((c: any) => {
          c.lastMessageAt = Date.now();
        });
      } catch {
        // ignore
      }
    });

    wsService.sendMessage(chatId, textToSend, localId);
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.headerSafeArea}>
        <Animated.View entering={FadeInUp.duration(260)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f97316" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>Диалог</Text>
            <Text style={styles.headerStatus}>онлайн</Text>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatBackground}>
          <FlashList
            data={messages}
            renderItem={({ item }) => <MessageBubble message={item} isMine={(item._raw as any).user_id === userId} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
          />
        </View>

        <SafeAreaView style={styles.inputSafeArea}>
          <Animated.View entering={FadeInUp.duration(280)} style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach" size={24} color="#94a3b8" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Написать сообщение..."
              placeholderTextColor="#64748b"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            {inputText.trim() ? (
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Ionicons name="paper-plane" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micButton}>
                <Ionicons name="mic-outline" size={22} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const enhance = withObservables(['id'], ({ id }: { id: string }) => ({
  messages: database.get<Message>('messages').query(Q.where('chat_id', id), Q.sortBy('created_at', Q.asc)).observe(),
}));

export default enhance(ChatRoom);

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#020617' },
  headerSafeArea: { backgroundColor: '#0b1220', paddingTop: Platform.OS === 'android' ? 30 : 0 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#0b1220',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: { padding: 8, width: 40 },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  headerStatus: { fontSize: 12, color: '#22c55e', marginTop: 2 },
  container: { flex: 1, backgroundColor: '#020617' },
  chatBackground: { flex: 1, backgroundColor: '#020617' },
  bubbleContainer: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 8 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#f97316', borderBottomRightRadius: 6 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#1e293b', borderBottomLeftRadius: 6 },
  messageText: { fontSize: 15, lineHeight: 21 },
  myText: { color: '#fff' },
  theirText: { color: '#f1f5f9' },

  metaData: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', marginTop: 4, marginLeft: 10 },
  timeText: { fontSize: 11 },
  myTime: { color: 'rgba(255,255,255,0.75)' },
  theirTime: { color: '#94a3b8' },
  pendingIcon: { marginLeft: 4, marginTop: 1 },
  inputSafeArea: { backgroundColor: '#0b1220' },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#0b1220',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  attachButton: { padding: 8, marginBottom: 2 },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    color: '#f8fafc',
    borderRadius: 20,
    fontSize: 15,
    maxHeight: 120,
    paddingTop: 11,
    paddingBottom: 11,
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginLeft: 6,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginLeft: 6,
  },
});
