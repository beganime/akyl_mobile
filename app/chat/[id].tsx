// app/chat/[id].tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/database';
import { Message } from '../../src/database/models/Message';
import { wsService } from '../../src/services/websocket';

const generateLocalId = () => Math.random().toString(36).substring(2, 15);

// Индивидуальный "пузырь" сообщения
const MessageBubble = ({ message }: { message: Message }) => {
  // Временно определяем свои/чужие по наличию флага isRead (как заглушка, 
  // в реальности нужно сравнивать message.user.id с ID профиля из стора)
  const isMine = message.isRead; // Допустим, мы ставили isRead=true при ACK отправки
  
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.bubbleContainer, isMine ? styles.myBubble : styles.theirBubble]}>
      <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>{message.text}</Text>
      <View style={styles.metaData}>
        <Text style={[styles.timeText, isMine ? styles.myTime : styles.theirTime]}>{time}</Text>
        {isMine && !message.isRead && <Text style={styles.pendingIcon}> 🕒</Text>}
      </View>
    </View>
  );
};

const ChatRoom = ({ messages }: { messages: Message[] }) => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [inputText, setInputText] = useState('');

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    const localId = generateLocalId();
    setInputText(''); // Мгновенно очищаем поле ввода

    // 1. Оптимистичный UI: Сначала пишем в локальную БД
    await database.write(async () => {
      const messagesCollection = database.get<Message>('messages');
      await messagesCollection.create((msg) => {
        msg._raw.id = localId; // Временный ID
        msg._raw.chat_id = chatId;
        msg.text = textToSend;
        msg.createdAt = Date.now();
        msg.isRead = false; // Статус "ожидание отправки" (часики)
      });
      
      // Обновляем время последнего сообщения в чате
      const chatCollection = database.get('chats');
      try {
        const chat = await chatCollection.find(chatId);
        await chat.update((c: any) => {
          c.lastMessageAt = Date.now();
        });
      } catch(e) {}
    });

    // 2. Отправляем по WebSocket на бэкенд
    wsService.sendMessage(chatId, textToSend, localId);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Чат</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlashList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={60}
        inverted // Сообщения идут снизу вверх (как в Телеграм)
        contentContainerStyle={{ padding: 16 }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Сообщение..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Отпр</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// Реактивно подписываемся на сообщения конкретного чата, сортируем по убыванию даты
const enhance = withObservables(['id'], ({ id }: { id: string }) => ({
  messages: database.get<Message>('messages')
    .query(
      Q.where('chat_id', id),
      Q.sortBy('created_at', Q.desc)
    )
    .observe(),
}));

export default enhance(ChatRoom);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E4EDF5' }, // Фон в стиле Telegram
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D1D6',
    ...Platform.select({ ios: { paddingTop: 50 } }) // Учет челки на iOS (лучше использовать SafeArea)
  },
  backButton: { width: 60 },
  backText: { color: '#007AFF', fontSize: 17 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  bubbleContainer: { maxWidth: '80%', padding: 10, borderRadius: 18, marginBottom: 8 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16 },
  myText: { color: '#FFF' },
  theirText: { color: '#000' },
  metaData: { flexDirection: 'row', alignSelf: 'flex-end', marginTop: 4 },
  timeText: { fontSize: 11 },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  theirTime: { color: '#8E8E93' },
  pendingIcon: { fontSize: 10 },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FAFAFC',
    borderTopWidth: 1,
    borderTopColor: '#D1D1D6',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    marginBottom: 4,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});