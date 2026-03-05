import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export class User extends Model {
  static table = 'users';

  @text('username') username!: string;
  @text('avatar_url') avatarUrl?: string;
  @field('is_bot') isBot!: boolean;
}