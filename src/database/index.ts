import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { User } from './models/User';
import { Chat } from './models/Chat';
import { Message } from './models/Message';

// Архитектурное решение: Инициализация адаптера SQLite.
// jsi: true включает прямое C++ взаимодействие между JS и SQLite, 
// минуя медленный асинхронный мост React Native. Это критично для списков сообщений.
const adapter = new SQLiteAdapter({
  schema,
  jsi: true, 
  onSetUpError: error => {
    // В продакшене тут должна быть отправка в Sentry/Crashlytics
    console.error('WatermelonDB setup error:', error);
  }
});

// Экспортируем синглтон базы данных для использования во всем приложении
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Chat,
    Message,
  ],
});