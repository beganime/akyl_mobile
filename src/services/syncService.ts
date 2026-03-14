import { database } from '../database';
import { Chat } from '../database/models/Chat';
import { Message } from '../database/models/Message';
import { chatsApi } from '../api/endpoints';

export const syncChats = async () => {
  try {
    const response = await chatsApi.list(0, 50);
    const apiChats = response.data;

    await database.write(async () => {
      const chatsCollection = database.get<Chat>('chats');
      const batchOperations: any[] = [];

      for (const chatData of apiChats) {
        try {
          const existingChat = await chatsCollection.find(chatData.id);
          batchOperations.push(
            existingChat.prepareUpdate((chat) => {
              chat.lastMessageAt = new Date(chatData.updated_at).getTime();
              chat.type = chatData.type;
            })
          );
        } catch {
          batchOperations.push(
            chatsCollection.prepareCreate((chat) => {
              chat._raw.id = chatData.id;
              chat.type = chatData.type;
              chat.title = chatData.type === 'dialog' ? 'Диалог' : 'Группа';
              chat.lastMessageAt = new Date(chatData.updated_at).getTime();
            })
          );
        }
      }

      if (batchOperations.length > 0) {
        await database.batch(...batchOperations);
      }
    });
  } catch (error) {
    console.error('Ошибка синхронизации чатов:', error);
  }
};

export const syncChatMessages = async (chatId: string) => {
  try {
    const response = await chatsApi.messages(chatId, 0, 100);
    const apiMessages = response.data;

    await database.write(async () => {
      const messagesCollection = database.get<Message>('messages');
      const batchOperations: any[] = [];

      for (const message of apiMessages) {
        try {
          const existing = await messagesCollection.find(message.id);
          batchOperations.push(
            existing.prepareUpdate((msg) => {
              msg.text = message.text;
              msg.createdAt = new Date(message.created_at).getTime();
              (msg._raw as any).user_id = message.sender_id;
            })
          );
        } catch {
          batchOperations.push(
            messagesCollection.prepareCreate((msg) => {
              msg._raw.id = message.id;
              (msg._raw as any).chat_id = message.chat_id;
              (msg._raw as any).user_id = message.sender_id;
              msg.text = message.text;
              msg.createdAt = new Date(message.created_at).getTime();
              msg.isRead = true;
            })
          );
        }
      }

      if (batchOperations.length > 0) {
        await database.batch(...batchOperations);
      }
    });
  } catch (error) {
    console.error('Ошибка синхронизации сообщений:', error);
  }
};
