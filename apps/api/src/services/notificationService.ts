import { withRedis } from '../utils/redis.js';
import { getLimiter } from '../utils/rateLimit.js';

export class NotificationService {
  private isEnabled(): boolean { return (process.env.COMMENTS_MENTIONS_NOTIFY || 'false').toLowerCase() === 'true'; }

  async notifyMentions(tenantId: string, dashboardId: string, actorUserId: string, mentions: string[], body: string): Promise<void> {
    if (!this.isEnabled() || mentions.length === 0) return;
    // Rate-limit per tenant+user
    for (const m of mentions) {
      try { await getLimiter('notify:mentions', 60, 60).consume(`${tenantId}:${m}`); } catch { continue; }
    }

    const payload = { tenantId, dashboardId, actorUserId, mentions, preview: String(body).slice(0, 120) };

    // Try BullMQ if Redis available
    await withRedis(async (r) => {
      const { Queue } = await import('bullmq');
      const queue = new Queue('notifications', { connection: r as any });
      await queue.add('mention', payload, { attempts: 3, removeOnComplete: true, removeOnFail: 50 });
    }, async () => {
      // Fallback: immediate no-op or log; TODO: integrate email/slack adapters
      return;
    });
  }
}

export const notificationService = new NotificationService();

