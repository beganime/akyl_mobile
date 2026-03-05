import { Model } from '@nozbe/watermelondb';
import { text, date, field, relation } from '@nozbe/watermelondb/decorators';
import { Chat } from './Chat';
import { User } from './User';

export class Message extends Model {
  static table = 'messages';

  // Связь (многие к 1): Сообщение принадлежит Чату и Пользователю
  static associations = {
    chats: { type: 'belongs_to' as const, key: 'chat_id' },
    users: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @text('text') text!: string;
  @date('created_at') createdAt!: number;
  @field('is_read') isRead!: boolean;

  @relation('chats', 'chat_id') chat!: Chat;
  @relation('users', 'user_id') user!: User;
}