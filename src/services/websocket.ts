// src/services/websocket.ts
import { database } from '../database';
import { Message } from '../database/models/Message';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client'; // Добавлен импорт клиента

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    // Берем актуальный baseURL, который мы вычислили при старте приложения
    const httpUrl = apiClient.defaults.baseURL as string || 'https://akyl-cheshmesi.ru/api/v1';
    
    // Заменяем http/https на ws/wss
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
      console.warn('Попытка отправки при закрытом сокете.');
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000);
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
            msg._raw.id = data.message_id;
            msg._raw.chat_id = data.chat_id;
            msg._raw.user_id = data.sender_id;
            msg.text = data.text;
            msg.createdAt = new Date(data.created_at).getTime();
            msg.isRead = false;
          });
        });
        break;

      case 'message_ack':
        await database.write(async () => {
          const messagesCollection = database.get<Message>('messages');
          try {
            const localMsg = await messagesCollection.find(data.local_id);
            await localMsg.update((msg) => {
              msg.isRead = true; 
            });
          } catch (e) {
            // Сообщение уже синхронизировано или не найдено
          }
        });
        break;
      default:
        break;
    }
  }
}

export const wsService = new WebSocketService();