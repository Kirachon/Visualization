/**
 * Realtime Data Service
 * Story 2.4: Real-time Dashboard Updates
 * 
 * Manages real-time data subscriptions and message distribution using Redis pub/sub.
 */

import Redis from 'ioredis';
import { logger } from '../logger/logger.js';

/**
 * Subscription callback type
 */
type SubscriptionCallback = (data: any) => void;

/**
 * Subscriber metadata
 */
interface Subscriber {
  clientId: string;
  callback: SubscriptionCallback;
  subscribedAt: number;
}

/**
 * Realtime Data Service Class
 */
export class RealtimeDataService {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private subscriptions: Map<string, Set<Subscriber>> = new Map();
  private messageQueue: Map<string, any[]> = new Map();
  private readonly MAX_QUEUE_SIZE = 100;

  /**
   * Initialize Redis connections
   */
  async initialize(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // Create publisher connection
    this.publisher = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Create subscriber connection
    this.subscriber = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Handle subscriber messages
    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });

    // Handle errors
    this.publisher.on('error', (error) => {
      logger.error('Redis publisher error', { error: error.message });
    });

    this.subscriber.on('error', (error) => {
      logger.error('Redis subscriber error', { error: error.message });
    });

    logger.info('Realtime data service initialized');
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, clientId: string, callback: SubscriptionCallback): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());

      // Subscribe to Redis channel
      if (this.subscriber) {
        this.subscriber.subscribe(topic, (err) => {
          if (err) {
            logger.error('Failed to subscribe to Redis channel', { topic, error: err.message });
          } else {
            logger.info('Subscribed to Redis channel', { topic });
          }
        });
      }
    }

    const subscribers = this.subscriptions.get(topic)!;
    subscribers.add({
      clientId,
      callback,
      subscribedAt: Date.now(),
    });

    logger.info('Client subscribed to topic', { topic, clientId, subscriberCount: subscribers.size });

    // Send any queued messages
    this.sendQueuedMessages(topic, clientId, callback);
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string, clientId: string): void {
    const subscribers = this.subscriptions.get(topic);
    if (!subscribers) {
      return;
    }

    // Remove subscriber
    const toRemove = Array.from(subscribers).find((s) => s.clientId === clientId);
    if (toRemove) {
      subscribers.delete(toRemove);
    }

    logger.info('Client unsubscribed from topic', { topic, clientId, subscriberCount: subscribers.size });

    // If no more subscribers, unsubscribe from Redis
    if (subscribers.size === 0) {
      this.subscriptions.delete(topic);

      if (this.subscriber) {
        this.subscriber.unsubscribe(topic, (err) => {
          if (err) {
            logger.error('Failed to unsubscribe from Redis channel', { topic, error: err.message });
          } else {
            logger.info('Unsubscribed from Redis channel', { topic });
          }
        });
      }
    }
  }

  /**
   * Publish data to a topic
   */
  async publish(topic: string, data: any): Promise<void> {
    if (!this.publisher) {
      logger.error('Publisher not initialized');
      return;
    }

    try {
      const message = JSON.stringify({
        topic,
        data,
        timestamp: Date.now(),
      });

      await this.publisher.publish(topic, message);

      logger.debug('Published message to topic', { topic });
    } catch (error: any) {
      logger.error('Failed to publish message', { topic, error: error.message });
    }
  }

  /**
   * Handle incoming message from Redis
   */
  private handleMessage(channel: string, message: string): void {
    try {
      const parsed = JSON.parse(message);
      const { topic, data } = parsed;

      const subscribers = this.subscriptions.get(topic);
      if (!subscribers || subscribers.size === 0) {
        // Queue message for future subscribers
        this.queueMessage(topic, data);
        return;
      }

      // Fanout to all subscribers
      subscribers.forEach((subscriber) => {
        try {
          subscriber.callback(data);
        } catch (error: any) {
          logger.error('Subscriber callback error', {
            topic,
            clientId: subscriber.clientId,
            error: error.message,
          });
        }
      });

      logger.debug('Fanned out message to subscribers', { topic, subscriberCount: subscribers.size });
    } catch (error: any) {
      logger.error('Failed to handle Redis message', { channel, error: error.message });
    }
  }

  /**
   * Queue message for topic
   */
  private queueMessage(topic: string, data: any): void {
    if (!this.messageQueue.has(topic)) {
      this.messageQueue.set(topic, []);
    }

    const queue = this.messageQueue.get(topic)!;

    // Add message to queue
    queue.push({
      data,
      timestamp: Date.now(),
    });

    // Enforce max queue size (drop oldest)
    if (queue.length > this.MAX_QUEUE_SIZE) {
      queue.shift();
      logger.warn('Message queue overflow, dropped oldest message', { topic });
    }
  }

  /**
   * Send queued messages to new subscriber
   */
  private sendQueuedMessages(topic: string, clientId: string, callback: SubscriptionCallback): void {
    const queue = this.messageQueue.get(topic);
    if (!queue || queue.length === 0) {
      return;
    }

    logger.info('Sending queued messages to new subscriber', { topic, clientId, count: queue.length });

    queue.forEach((message) => {
      try {
        callback(message.data);
      } catch (error: any) {
        logger.error('Failed to send queued message', { topic, clientId, error: error.message });
      }
    });

    // Clear queue after sending
    this.messageQueue.delete(topic);
  }

  /**
   * Get subscription statistics
   */
  getStats(): {
    topics: number;
    subscribers: number;
    queuedMessages: number;
  } {
    let totalSubscribers = 0;
    let totalQueuedMessages = 0;

    this.subscriptions.forEach((subscribers) => {
      totalSubscribers += subscribers.size;
    });

    this.messageQueue.forEach((queue) => {
      totalQueuedMessages += queue.length;
    });

    return {
      topics: this.subscriptions.size,
      subscribers: totalSubscribers,
      queuedMessages: totalQueuedMessages,
    };
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
    }

    if (this.publisher) {
      await this.publisher.quit();
    }

    this.subscriptions.clear();
    this.messageQueue.clear();

    logger.info('Realtime data service shut down');
  }
}

export const realtimeDataService = new RealtimeDataService();

