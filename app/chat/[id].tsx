import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../src/database';
import { Message } from '../../src/database/models/Message';
import { wsService } from '../../src/services/websocket';
import { syncChatMessages } from '../../src/services/syncService';
import { useAuthStore } from '../../src/store/authStore';

const generateLocalId = () => Math.random().toString(36).substring(2, 15);

const MessageBubble = ({ message, isMine }: { message: Message; isMine: boolean }) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.bubbleContainer, isMine ? styles.myBubble : styles.theirBubble]}>
      <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>{message.text}</Text>
      <View style={styles.metaData}>
        <Text style={[styles.timeText, isMine ? styles.myTime : styles.theirTime]}>{time}</Text>
        {isMine && (
          <Ionicons
            name={message.isRead ? 'checkmark-outline' : 'time-outline'}
            size={14}
            color="rgba(255,255,255,0.7)"
            style={styles.pendingIcon}
          />
        )}
      </View>
    </View>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#F97316" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>Диалог</Text>
            <Text style={styles.headerStatus}>в сети</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
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
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach" size={28} color="#8E9EAB" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Сообщение..."
              placeholderTextColor="#8E9EAB"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            {inputText.trim() ? (
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Ionicons name="send" size={24} color="#F97316" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.sendButton}>
                <Ionicons name="mic-outline" size={28} color="#8E9EAB" />
              </TouchableOpacity>
            )}
          </View>
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
  wrapper: { flex: 1, backgroundColor: '#13203B' },
  headerSafeArea: { backgroundColor: '#13203B', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#13203B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: { padding: 5, width: 40 },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  headerStatus: { fontSize: 13, color: '#8E9EAB', marginTop: 2 },
  container: { flex: 1, backgroundColor: '#0B1426' },
  chatBackground: { flex: 1, backgroundColor: '#0B1426' },
  bubbleContainer: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 8 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#F97316', borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#1D2D44', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16, lineHeight: 22 },
  myText: { color: '#FFFFFF' },
  theirText: { color: '#FFFFFF' },
  metaData: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', marginTop: 4, marginLeft: 10 },
  timeText: { fontSize: 11 },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  theirTime: { color: '#8E9EAB' },
  pendingIcon: { marginLeft: 4, marginTop: 1 },
  inputSafeArea: { backgroundColor: '#13203B' },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#13203B',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  attachButton: { padding: 8, marginBottom: 2 },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sendButton: { padding: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
});
