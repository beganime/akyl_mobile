import { Model } from '@nozbe/watermelondb';
import { text, date, children } from '@nozbe/watermelondb/decorators';

export class Chat extends Model {
  static table = 'chats';

  // Связь (1 ко многим): Чат имеет много Сообщений
  static associations = {
    messages: { type: 'has_many' as const, foreignKey: 'chat_id' },
  };

  @text('title') title?: string;
  @text('type') type!: string;
  @date('last_message_at') lastMessageAt!: number;

  @children('messages') messages!: any;
}