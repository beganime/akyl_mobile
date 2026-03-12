// src/database/adapter.ts (Используется для iOS и Android)
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';

export const adapter = new SQLiteAdapter({
  schema,
  jsi: false,
  onSetUpError: error => {
    console.error('WatermelonDB (Mobile) setup error:', error);
  }
});