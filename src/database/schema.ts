import { appSchema, tableSchema } from '@nozbe/watermelondb';

// Архитектурное решение: Описываем жесткую схему локальной БД. 
// Все данные чатов будут лежать тут для мгновенного доступа без сети.
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'username', type: 'string' },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'is_bot', type: 'boolean' },
      ]
    }),
    tableSchema({
      name: 'chats',
      columns: [
        { name: 'title', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }, // 'private' или 'group'
        { name: 'last_message_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'text', type: 'string' },
        { name: 'chat_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'is_read', type: 'boolean' },
      ]
    }),
  ]
});