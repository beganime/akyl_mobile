// src/database/adapter.web.ts (Используется только для Web)
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';

export const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onQuotaExceededError: (error) => console.error('Quota exceeded', error),
  onSetUpError: (error) => console.error('WatermelonDB (Web) setup error:', error),
});