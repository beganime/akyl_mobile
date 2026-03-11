// src/services/websocket.ts
import { database } from '../database';
import { Message } from '../database/models/Message';
import { useAuthStore } from '../store/authStore';

// Архитектурное решение: Singleton-паттерн для управления единственным WS соединением.
// Реализован механизм Exponential Backoff для предотвращения DDoS-атаки на собственный сервер 
// при массовом переподключении пользователей после сбоя сети.
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000; // 1 секунда
  private pingInterval: NodeJS.Timeout | null = null;

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return; // Уже подключены или в процессе
    }

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    // Динамически формируем WS URL из HTTP URL (заменяем http на ws)
    const httpUrl = process.env.EXPO_PUBLIC_API_URL || 'https://akyl-cheshmesi.ru/api/v1';
    const wsBaseUrl = httpUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBaseUrl}/ws/chat?token=${accessToken}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket подключен');
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleIncomingMessage(data);
      } catch (error) {
        console.error('Ошибка парсинга WS сообщения:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('❌ WebSocket отключен:', event.code, event.reason);
      this.stopPing();
      this.ws = null;
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('⚠️ Ошибка WebSocket:', error);
      // onclose сработает следом и запустит реконнект
    };
  }

  public disconnect() {
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, 'User logged out');
      this.ws = null;
    }
  }

  public sendMessage(chatId: string, text: string, localId: string, attachment: any = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        action: 'send_message',
        chat_id: chatId,
        text: text,
        local_id: localId,
        attachment: attachment,
      };
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('Попытка отправки при закрытом сокете. Сообщение останется висеть с "часиками" в БД.');
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Достигнут лимит попыток переподключения к WebSocket');
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Попытка переподключения через ${delay}ms... (Попытка ${this.reconnectAttempts + 1})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startPing() {
    // Поддержание активности соединения (Heartbeat)
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000); // каждые 30 сек
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private async handleIncomingMessage(data: any) {
    switch (data.action) {
      case 'new_message':
        await database.write(async () => {
          const messagesCollection = database.get<Message>('messages');
          await messagesCollection.create((msg) => {
            msg._raw.id = data.message_id; // Принудительно ставим серверный ID
            msg._raw.chat_id = data.chat_id;
            msg._raw.user_id = data.sender_id;
            msg.text = data.text;
            msg.createdAt = new Date(data.created_at).getTime();
            msg.isRead = false; // Входящее всегда непрочитано
          });
        });
        break;

      case 'message_ack':
        // Сервер подтвердил нашу отправку
        await database.write(async () => {
          const messagesCollection = database.get<Message>('messages');
          try {
            // Ищем локальное сообщение по local_id, чтобы заменить ID на серверный и убрать "часики"
            const localMsg = await messagesCollection.find(data.local_id);
            await localMsg.update((msg) => {
              // В WatermelonDB менять ID записи после создания нельзя, 
              // поэтому мы помечаем его как отправленное (в реальном приложении добавляется поле status: 'sent' | 'pending')
              // Для простоты, мы будем использовать isRead как индикатор успешной отправки для своих сообщений,
              // либо вы можете добавить поле status в модель Message.
              msg.isRead = true; // Считаем "доставлено на сервер"
            });
          } catch (e) {
            console.log('Локальное сообщение не найдено для ACK', data.local_id);
          }
        });
        break;
      
      default:
        break;
    }
  }
}

export const wsService = new WebSocketService();