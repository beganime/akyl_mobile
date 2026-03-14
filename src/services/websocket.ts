import { database } from '../database';
import { Message } from '../database/models/Message';
import { useAuthStore } from '../store/authStore';
import { getActiveApiBaseUrl } from '../api/client';


class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    const wsBaseUrl = getActiveApiBaseUrl().replace(/^http/, 'ws');

    const wsUrl = `${wsBaseUrl}/ws/chat?token=${accessToken}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
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

    this.ws.onclose = () => {
      this.stopPing();
      this.ws = null;
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('Ошибка WebSocket:', error);
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
      this.ws.send(
        JSON.stringify({
          action: 'send_message',
          chat_id: chatId,
          text,
          local_id: localId,
          attachment,
        })
      );
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
      case 'new_message': {
        await database.write(async () => {
          const messagesCollection = database.get<Message>('messages');
          await messagesCollection.create((msg) => {
            msg._raw.id = data.message_id;
            (msg._raw as any).chat_id = data.chat_id;
            (msg._raw as any).user_id = data.sender_id;
            msg.text = data.text;
            msg.createdAt = new Date(data.created_at).getTime();
            msg.isRead = true;
          });
        });
        break;
      }
      case 'message_ack': {
        await database.write(async () => {
          const messagesCollection = database.get<Message>('messages');
          try {
            const localMsg = await messagesCollection.find(data.local_id);
            await localMsg.update((msg) => {
              msg.isRead = true;
              if (data.created_at) {
                msg.createdAt = new Date(data.created_at).getTime();
              }
            });
          } catch {
            // not found
          }
        });
        break;
      }
      default:
        break;
    }
  }
}

export const wsService = new WebSocketService();
