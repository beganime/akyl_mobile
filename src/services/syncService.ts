// src/services/syncService.ts
import { database } from '../database';
import { Chat } from '../database/models/Chat';
import { apiClient } from '../api/client';

export const syncChats = async () => {
  try {
    // 1. Получаем чаты по REST API
    const response = await apiClient.get('/chats/?skip=0&limit=50');
    const apiChats = response.data; // Ожидается массив: [{id, type, updated_at}]

    // 2. Исполняем пакетную операцию (Batching) в WatermelonDB для максимальной скорости
    await database.write(async () => {
      const chatsCollection = database.get<Chat>('chats');
      
      // Чтобы не перезаписывать всё, мы можем использовать batch
      const batchOperations: any[] = [];

      for (const chatData of apiChats) {
        try {
          // Если чат существует, обновляем дату
          const existingChat = await chatsCollection.find(chatData.id);
          batchOperations.push(
            existingChat.prepareUpdate((chat) => {
              chat.lastMessageAt = new Date(chatData.updated_at).getTime();
            })
          );
        } catch (error) {
          // Если чата нет, создаем новый
          batchOperations.push(
            chatsCollection.prepareCreate((chat) => {
              chat._raw.id = chatData.id;
              chat.type = chatData.type;
              // Если бэкенд возвращает имя/тайтл собеседника, подставьте его. Пока заглушка:
              chat.title = chatData.title || (chatData.type === 'dialog' ? 'Личные сообщения' : 'Группа');
              chat.lastMessageAt = new Date(chatData.updated_at).getTime();
            })
          );
        }
      }

      // Коммитим транзакцию разом
      if (batchOperations.length > 0) {
        await database.batch(...batchOperations);
      }
    });

    console.log('Синхронизация чатов успешно завершена');
  } catch (error) {
    console.error('Ошибка синхронизации чатов:', error);
  }
};