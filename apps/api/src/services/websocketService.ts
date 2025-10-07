/**
 * WebSocket Service
 * Story 2.4: Real-time Dashboard Updates
 *
 * Manages WebSocket connections, authentication, subscriptions, and message routing.
 */

import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse as parseCookie } from 'cookie';
import { verify } from 'jsonwebtoken';
import { logger } from '../logger/logger.js';
import { realtimeDataService } from './realtimeDataService.js';

/**
 * WebSocket message types
 */
export enum WSMessageType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  RESUME = 'resume',
  UPDATE = 'update',
  COLLAB_PRESENCE = 'collab_presence',
  COLLAB_COMMENT = 'collab_comment',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
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
  // Collaboration payloads
  dashboardId?: string;
  cursorPosition?: any; // presence
  comment?: { body: string; parentId?: string | null; mentions?: string[] };
}

/**
 * Client connection metadata
 */
interface ClientConnection {
  ws: any;
  userId: string;
  tenantId: string;
  subscriptions: Set<string>; // Set of topic IDs
  lastActivity: number;
  resumeToken?: string;
}

/**
 * WebSocket Service Class
 */
export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly CLIENT_TIMEOUT = 60000; // 60 seconds

  /**
   * Initialize WebSocket server
   */
  initialize(server: any): void {
    this.wss = new WebSocketServer({
      server,
      path: '/api/ws',
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: any, req: IncomingMessage): Promise<void> {
    try {
      // Authenticate connection
      const auth = await this.authenticateConnection(req);
      if (!auth) {
        ws.close(1008, 'Authentication failed');
        return;
      }

      const { userId, tenantId } = auth;
      const clientId = this.generateClientId();

      // Store client connection
      const client: ClientConnection = {
        ws,
        userId,
        tenantId,
        subscriptions: new Set(),
        lastActivity: Date.now(),
      };

      this.clients.set(clientId, client);

      logger.info('WebSocket client connected', { clientId, userId, tenantId });

      // Set up message handler
      ws.on('message', (data: Buffer) => {
        this.handleMessage(clientId, data);
      });

      // Set up close handler
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Set up error handler
      ws.on('error', (error: any) => {
        logger.error('WebSocket error', { clientId, error: error.message });
      });

      // Update last activity on pong
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastActivity = Date.now();
        }
      });

    } catch (error: any) {
      logger.error('Failed to handle WebSocket connection', { error: error.message });
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Authenticate WebSocket connection
   */
  private async authenticateConnection(req: IncomingMessage): Promise<{ userId: string; tenantId: string } | null> {
    try {
      // Extract JWT from cookie
      const cookieHeader = req.headers.cookie;
      if (!cookieHeader) {
        return null;
      }

      const cookies = parseCookie(cookieHeader);
      const token = cookies.token || cookies.jwt;

      if (!token) {
        return null;
      }

      // Verify JWT
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = verify(token, secret) as any;

      return {
        userId: decoded.id || decoded.userId,
        tenantId: decoded.tenantId,
      };
    } catch (error) {
      logger.error('WebSocket authentication failed', { error });
      return null;
    }
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(clientId: string, data: Buffer): void {
    try {
      const client = this.clients.get(clientId);
      if (!client) {
        return;
      }

      client.lastActivity = Date.now();

      const message: WSMessage = JSON.parse(data.toString());

      switch (message.type) {
        case WSMessageType.SUBSCRIBE:
          this.handleSubscribe(clientId, message);
          break;

        case WSMessageType.UNSUBSCRIBE:
          this.handleUnsubscribe(clientId, message);
          break;

        case WSMessageType.RESUME:
          this.handleResume(clientId, message);
          break;

        case WSMessageType.PING:
          this.handlePing(clientId);
          break;

        case WSMessageType.COLLAB_PRESENCE:
          this.handleCollabPresence(clientId, message);
          break;

        case WSMessageType.COLLAB_COMMENT:
          this.handleCollabComment(clientId, message);
          break;

        default:
          this.sendError(clientId, `Unknown message type: ${message.type}`);
      }


    } catch (error: any) {
      logger.error('Failed to handle WebSocket message', { clientId, error: error.message });
      this.sendError(clientId, 'Invalid message format');
    }
  }

  /**
   * Handle subscribe request
   */
  private handleSubscribe(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !message.widgetId || !message.topic) {
      this.sendError(clientId, 'Invalid subscribe request');
      return;
    }

    // Validate topic access (tenant isolation)
    if (!this.validateTopicAccess(client.tenantId, message.topic)) {
      this.sendError(clientId, 'Access denied to topic');
      return;
    }

    // Add subscription
    const topicKey = `${message.widgetId}:${message.topic}`;
    client.subscriptions.add(topicKey);

    // Register with realtime data service
    realtimeDataService.subscribe(topicKey, clientId, (data: any) => {
      this.sendUpdate(clientId, message.widgetId!, data);
    });

    logger.info('Client subscribed to topic', { clientId, widgetId: message.widgetId, topic: message.topic });
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !message.widgetId || !message.topic) {
      return;
    }

    const topicKey = `${message.widgetId}:${message.topic}`;
    client.subscriptions.delete(topicKey);

    // Unregister from realtime data service
    realtimeDataService.unsubscribe(topicKey, clientId);

    logger.info('Client unsubscribed from topic', { clientId, widgetId: message.widgetId, topic: message.topic });
  }

  /**
   * Handle resume request
   */
  private handleResume(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !message.resumeToken) {
      this.sendError(clientId, 'Invalid resume request');
      return;


    }

    // TODO: Implement resume token validation and replay missed messages
    client.resumeToken = message.resumeToken;

    logger.info('Client resumed with token', { clientId, resumeToken: message.resumeToken });
  }

  /**
   * Handle ping request
   */
  private handlePing(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    this.send(clientId, {
      type: WSMessageType.PONG,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    // Unsubscribe from all topics
    client.subscriptions.forEach((topicKey) => {
      realtimeDataService.unsubscribe(topicKey, clientId);
    });

    this.clients.delete(clientId);

    logger.info('WebSocket client disconnected', { clientId });
  }

  /**
   * Send update to client
   */
  private sendUpdate(clientId: string, widgetId: string, data: any): void {
    this.send(clientId, {
      type: WSMessageType.UPDATE,
      widgetId,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Send ack to client
   */
  private sendAck(clientId: string, data: any): void {
    this.send(clientId, {
      type: WSMessageType.UPDATE,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Send error to client
   */
  private sendError(clientId: string, error: string): void {
    this.send(clientId, {
      type: WSMessageType.ERROR,
      error,
      timestamp: Date.now(),

    });
  }

  /**
   * Handle collaboration presence updates
   */
  private async handleCollabPresence(clientId: string, message: WSMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !message.dashboardId) {
      this.sendError(clientId, 'Invalid presence payload');
      return;
    }
    try {
      const { presenceService } = await import('./presenceService.js');
      await presenceService.upsertPresence({
        tenantId: client.tenantId,
        dashboardId: message.dashboardId,
        userId: client.userId,
        cursorPosition: message.cursorPosition ?? null,
      });
      const topic = `collab:presence:tenant:${client.tenantId}:dashboard:${message.dashboardId}`;
      await realtimeDataService.publish(topic, {
        type: 'presence.update',
        userId: client.userId,
        dashboardId: message.dashboardId,
        cursorPosition: message.cursorPosition ?? null,
        at: Date.now(),
      });
    } catch (err: any) {
      this.sendError(clientId, err?.message || 'Presence update failed');
    }
  }

  /**
   * Handle collaboration comment creation via WS
   */
  private async handleCollabComment(clientId: string, message: WSMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !message.dashboardId || !message.comment?.body) {
      this.sendError(clientId, 'Invalid comment payload');
      return;
    }
    try {
      const { commentService } = await import('./commentService.js');
      const created = await commentService.create({
        tenantId: client.tenantId,
        dashboardId: message.dashboardId,
        userId: client.userId,
        body: message.comment.body,
        parentId: message.comment.parentId,
        mentions: message.comment.mentions ?? [],
      });
      // Broadcast already handled inside commentService via realtimeDataService
      this.sendAck(clientId, { type: 'comment.created', id: created.id });
    } catch (err: any) {
      this.sendError(clientId, err?.message || 'Comment creation failed');
    }
  }


  /**
   * Send message to client
   */
  private send(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== 1) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error: any) {
      logger.error('Failed to send WebSocket message', { clientId, error: error.message });
    }
  }

  /**
   * Validate topic access for tenant
   */
  private validateTopicAccess(tenantId: string, topic: string): boolean {
    // Allowed topic formats:
    // - tenant:{tenantId}:...
    // - collab:presence:tenant:{tenantId}:dashboard:{dashboardId}
    // - collab:comments:tenant:{tenantId}:dashboard:{dashboardId}
    if (topic.startsWith(`tenant:${tenantId}:`)) return true;
    if (topic.startsWith(`collab:presence:tenant:${tenantId}:dashboard:`)) return true;
    if (topic.startsWith(`collab:comments:tenant:${tenantId}:dashboard:`)) return true;
    return false;
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start heartbeat to detect stale connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      this.clients.forEach((client, clientId) => {
        // Check if client is inactive
        if (now - client.lastActivity > this.CLIENT_TIMEOUT) {
          logger.warn('Closing inactive WebSocket connection', { clientId });
          client.ws.close(1000, 'Timeout');
          this.handleDisconnect(clientId);
          return;
        }

        // Send ping
        if (client.ws.readyState === 1) {
          client.ws.ping();
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client, clientId) => {
      client.ws.close(1001, 'Server shutting down');
      this.handleDisconnect(clientId);
    });

    if (this.wss) {
      (this.wss as any).close();
    }

    logger.info('WebSocket server shut down');
  }
}

export const websocketService = new WebSocketService();

