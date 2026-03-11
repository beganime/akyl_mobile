// src/database/index.ts
import { Database } from '@nozbe/watermelondb';
import { adapter } from './adapter'; // Сборщик сам решит: брать adapter.ts или adapter.web.ts!

import { User } from './models/User';
import { Chat } from './models/Chat';
import { Message } from './models/Message';

// Экспортируем синглтон базы данных для использования во всем приложении
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Chat,
    Message,
  ],
});