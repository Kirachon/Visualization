/**
 * WebSocket Client
 * Story 2.4: Real-time Dashboard Updates
 *
 * WebSocket client with automatic reconnection, exponential backoff, and resume token support.
 */

/**
 * WebSocket message types
 */
export enum WSMessageType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  RESUME = 'resume',
  UPDATE = 'update',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
  COLLAB_PRESENCE = 'collab_presence',
  COLLAB_COMMENT = 'collab_comment',
}


/**
 * WebSocket message interface
 */
export interface WSMessage {
  type: WSMessageType;
  widgetId?: string;
  topic?: string;
  resumeToken?: string;
  data?: any;
  error?: string;
  timestamp?: number;
  // Collaboration fields
  dashboardId?: string;
  comment?: { body: string; parentId?: string | null; mentions?: string[] };
  cursorPosition?: any;
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Subscription callback type
 */
type SubscriptionCallback = (data: any) => void;

/**
 * Status change callback type
 */
type StatusChangeCallback = (status: ConnectionStatus) => void;

/**
 * Subscription metadata
 */
interface Subscription {
  widgetId: string;
  topic: string;
  callback: SubscriptionCallback;
}

/**
 * WebSocket Client Class
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private subscriptions: Map<string, Subscription> = new Map();
  private statusCallbacks: Set<StatusChangeCallback> = new Set();
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private resumeToken: string | null = null;

  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly INITIAL_RECONNECT_DELAY = 1000; // 1 second
  private readonly MAX_RECONNECT_DELAY = 30000; // 30 seconds
  private readonly PING_INTERVAL = 30000; // 30 seconds

  constructor(url?: string) {
    this.url = url || this.getWebSocketUrl();
  }

  /**
   * Get WebSocket URL
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    this.setStatus(ConnectionStatus.CONNECTING);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.setStatus(ConnectionStatus.CONNECTED);
        this.reconnectAttempts = 0;

        // Resume subscriptions if we have a resume token
        if (this.resumeToken) {
          this.sendResume(this.resumeToken);
        }

        // Resubscribe to all topics
        this.subscriptions.forEach((subscription) => {
          this.sendSubscribe(subscription.widgetId, subscription.topic);
        });

        // Start ping interval
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed', { code: event.code, reason: event.reason });
        this.handleDisconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error', error);
        this.setStatus(ConnectionStatus.ERROR);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection', error);
      this.setStatus(ConnectionStatus.ERROR);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopPing();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Subscribe to a topic
   */
  subscribe(widgetId: string, topic: string, callback: SubscriptionCallback): void {
    const key = `${widgetId}:${topic}`;

    // Store subscription
    this.subscriptions.set(key, {
      widgetId,
      topic,
      callback,
    });

    // Send subscribe message if connected
    if (this.status === ConnectionStatus.CONNECTED) {
      this.sendSubscribe(widgetId, topic);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(widgetId: string, topic: string): void {
    const key = `${widgetId}:${topic}`;

    // Remove subscription
    this.subscriptions.delete(key);

    // Send unsubscribe message if connected
    if (this.status === ConnectionStatus.CONNECTED) {
      this.sendUnsubscribe(widgetId, topic);
    }
  }

  /**
   * Add status change callback
   */
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: WSMessage = JSON.parse(data);

      switch (message.type) {
        case WSMessageType.UPDATE:
          this.handleUpdate(message);
          break;

        case WSMessageType.ERROR:
          console.error('WebSocket error message', message.error);
          break;

        case WSMessageType.PONG:
          // Pong received, connection is alive
          break;

        default:
          console.warn('Unknown message type', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message', error);
    }
  }

  /**
   * Handle update message
   */
  private handleUpdate(message: WSMessage): void {
    if (!message.widgetId || !message.data) {
      return;
    }

    // Find matching subscriptions
    this.subscriptions.forEach((subscription, key) => {
      if (key.startsWith(`${message.widgetId}:`)) {
        try {
          subscription.callback(message.data);
        } catch (error) {
          console.error('Subscription callback error', error);
        }
      }
    });
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(): void {
    this.stopPing();

    if (this.status !== ConnectionStatus.DISCONNECTED) {
      this.setStatus(ConnectionStatus.RECONNECTING);
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnect with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnect attempts reached');
      this.setStatus(ConnectionStatus.ERROR);
      return;
    }

    const delay = Math.min(
      this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      this.MAX_RECONNECT_DELAY
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Send subscribe message
   */
  private sendSubscribe(widgetId: string, topic: string): void {
    this.send({
      type: WSMessageType.SUBSCRIBE,
      widgetId,
      topic,
    });
  }

  /**
   * Send unsubscribe message
   */
  private sendUnsubscribe(widgetId: string, topic: string): void {
    this.send({
      type: WSMessageType.UNSUBSCRIBE,
      widgetId,
      topic,
    });
  }

  /**
   * Send resume message
   */
  private sendResume(resumeToken: string): void {
    this.send({
      type: WSMessageType.RESUME,
      resumeToken,
    });
  }

  /**
   * Public: send collaboration presence
   */
  publicCollabPresence(dashboardId: string, cursorPosition?: any): void {
    this.send({ type: WSMessageType.COLLAB_PRESENCE, dashboardId, comment: undefined as any, cursorPosition });
  }

  /**
   * Public: send collaboration comment
   */
  publicCollabComment(dashboardId: string, body: string, parentId?: string | null, mentions?: string[]): void {
    this.send({ type: WSMessageType.COLLAB_COMMENT, dashboardId, comment: { body, parentId, mentions } });
  }

  /**
   * Send message to server
   */
  private send(message: WSMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message', error);
    }
  }

  /**
   * Start ping interval
   */
  private startPing(): void {
    this.stopPing();

    this.pingInterval = setInterval(() => {
      this.send({
        type: WSMessageType.PING,
        timestamp: Date.now(),
      });
    }, this.PING_INTERVAL);
  }

  /**
   * Stop ping interval
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Set connection status
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) {
      return;
    }

    this.status = status;

    // Notify callbacks
    this.statusCallbacks.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error('Status callback error', error);
      }
    });
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();
export default websocketClient;

