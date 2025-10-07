import http from 'http';
import request from 'supertest';
import WebSocket from 'ws';

jest.setTimeout(30000);

// IMPORTANT: mock realtimeDataService to avoid Redis in tests AND normalize topics
jest.mock('../../services/realtimeDataService.js', () => {
  type Callback = (data: any) => void;
  const subs = new Map<string, Map<string, Callback>>();
  const queue = new Map<string, any[]>();
  const addSub = (topic: string, clientId: string, cb: Callback) => {
    if (!subs.has(topic)) subs.set(topic, new Map());
    subs.get(topic)!.set(clientId, cb);
    // flush queued
    const q = queue.get(topic) || [];
    q.forEach((m) => cb(m));
    queue.delete(topic);
  };
  const baseTopic = (topic: string) => {
    // normalize widget-prefixed topics like "w1:collab:presence:..." to bare collab topic
    const idx = topic.indexOf('collab:');
    return idx >= 0 ? topic.slice(idx) : topic;
  };
  return {
    realtimeDataService: {
      initialize: jest.fn(async () => {}),
      shutdown: jest.fn(async () => { subs.clear(); queue.clear(); }),
      subscribe: (topic: string, clientId: string, cb: Callback) => {
        // subscribe to both exact and normalized topic to match publish
        addSub(topic, clientId, cb);
        const norm = baseTopic(topic);
        if (norm !== topic) addSub(norm, clientId, cb);
      },
      unsubscribe: (topic: string, clientId: string) => {
        const remove = (t: string) => { const m = subs.get(t); if (!m) return; m.delete(clientId); if (m.size === 0) subs.delete(t); };
        remove(topic); remove(baseTopic(topic));
      },
      publish: async (topic: string, data: any) => {
        const deliver = (t: string) => {
          const m = subs.get(t);
          if (!m || m.size === 0) {
            const q = queue.get(t) || [];
            q.push(data);
            queue.set(t, q);
            return false;
          }
          m.forEach((cb) => { try { cb(data); } catch {} });
          return true;
        };
        if (!deliver(topic)) {
          // also try delivering to any widget-prefixed variants
          for (const t of subs.keys()) {
            if (t.endsWith(topic)) deliver(t);
          }
        }
      },
    },
  };
});

import { app } from '../../server.js';
import { websocketService, WSMessageType } from '../../services/websocketService.js';

function delay(ms: number) { return new Promise((res) => setTimeout(res, ms)); }

/**
 * Helper to capture WS messages
 */
function trackMessages(ws: WebSocket) {
  const msgs: any[] = [];
  ws.on('message', (buf) => {
    try { const m = JSON.parse(String(buf)); msgs.push(m); /* eslint-disable no-console */ console.log('WS<-', m); } catch { /* ignore */ }
  });
  return msgs;
}

/**
 * Login helpers
 */
async function login(baseUrl: string, username: string, password: string) {
  const agent = request(baseUrl);
  const res = await agent.post('/api/v1/auth/login').send({ username, password });
  expect(res.status).toBe(200);
  const token = res.body.token as string;
  return { token };
}

/**
 * Builds a WS URL for the ephemeral http server
 */
function wsUrl(port: number) { return `ws://127.0.0.1:${port}/api/ws`; }

/**
 * Build collab topics
 */
function presenceTopic(tenantId: string, dashboardId: string) { return `collab:presence:tenant:${tenantId}:dashboard:${dashboardId}`; }
function commentTopic(tenantId: string, dashboardId: string) { return `collab:comments:tenant:${tenantId}:dashboard:${dashboardId}`; }


describe('WebSocket E2E Collaboration', () => {
  let httpServer: http.Server;
  let port: number;
  const tenantId = 'test-tenant';
  const dashboardId = 'ws-dash-1';

  beforeAll(async () => {
    httpServer = http.createServer(app);
    websocketService.initialize(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, () => resolve()));
    port = (httpServer.address() as any).port;
  });

  afterAll(async () => {
    // ensure ws shutdown first to close timers
    (websocketService as any).shutdown?.();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  async function waitFor<T>(fn: () => T | undefined, timeoutMs = 2000, intervalMs = 25): Promise<T> {
    const start = Date.now();
    return new Promise<T>((resolve, reject) => {
      const int = setInterval(() => {
        const val = fn();
        if (val !== undefined) { clearInterval(int); resolve(val as T); }
        else if (Date.now() - start > timeoutMs) { clearInterval(int); reject(new Error('timeout')); }
      }, intervalMs);
    });
  }

  it('multi-client presence: subscribe, broadcast, receive on both clients', async () => {
    const { token: tokenA } = await login(`http://127.0.0.1:${port}`, 'admin', 'admin123');
    const { token: tokenB } = await login(`http://127.0.0.1:${port}`, 'viewer', 'viewer123');

    const wsA = new WebSocket(wsUrl(port), { headers: { Cookie: `token=${tokenA}` } });
    const wsB = new WebSocket(wsUrl(port), { headers: { Cookie: `token=${tokenB}` } });

    const msgsA = trackMessages(wsA);
    const msgsB = trackMessages(wsB);

    await new Promise((resolve) => wsA.once('open', resolve));
    await new Promise((resolve) => wsB.once('open', resolve));

    // subscribe both to presence topic
    const payload = { type: WSMessageType.SUBSCRIBE, widgetId: 'w1', topic: presenceTopic(tenantId, dashboardId) };
    wsA.send(JSON.stringify(payload));
    wsB.send(JSON.stringify(payload));
    // give the server a tick to register subscriptions to avoid race
    await delay(100);

    // Send presence update from A
    wsA.send(JSON.stringify({ type: WSMessageType.COLLAB_PRESENCE, dashboardId, cursorPosition: { x: 10, y: 20 } }));

    const gotPresenceA = await waitFor(() => msgsA.find((m) => m.type === WSMessageType.UPDATE && m.data?.type === 'presence.update'));
    const gotPresenceB = await waitFor(() => msgsB.find((m) => m.type === WSMessageType.UPDATE && m.data?.type === 'presence.update'));
    expect(gotPresenceA).toBeTruthy();
    expect(gotPresenceB).toBeTruthy();

    wsA.close(); wsB.close();
    await delay(50);
  }, 10000);

  it('reconnection with replay: publish before subscribe, queued message delivered on subscribe', async () => {
    const { token } = await login(`http://127.0.0.1:${port}`, 'admin', 'admin123');
    const ws = new WebSocket(wsUrl(port), { headers: { Cookie: `token=${token}` } });
    const msgs = trackMessages(ws);
    await new Promise((resolve) => ws.once('open', resolve));

    // Publish a presence update BEFORE subscribe (should be queued)
    ws.send(JSON.stringify({ type: WSMessageType.COLLAB_PRESENCE, dashboardId, cursorPosition: { x: 1, y: 2 } }));
    await delay(50);

    // Now subscribe to presence topic – should immediately receive queued message
    ws.send(JSON.stringify({ type: WSMessageType.SUBSCRIBE, widgetId: 'w2', topic: presenceTopic(tenantId, dashboardId) }));

    const queued = await waitFor(() => msgs.find((m) => m.type === WSMessageType.UPDATE && m.data?.type === 'presence.update'));
    expect(queued).toBeTruthy();

    ws.close();
    await delay(50);
  }, 10000);

  it('comment creation via WS returns ack to sender (test env skips fanout)', async () => {
    const { token } = await login(`http://127.0.0.1:${port}`, 'admin', 'admin123');
    const ws = new WebSocket(wsUrl(port), { headers: { Cookie: `token=${token}` } });
    const msgs = trackMessages(ws);
    await new Promise((resolve) => ws.once('open', resolve));

    ws.send(JSON.stringify({ type: WSMessageType.COLLAB_COMMENT, dashboardId, comment: { body: 'Hello via WS' } }));

    const ack = await waitFor(() => msgs.find((m) => m.type === WSMessageType.UPDATE && m.data?.type === 'comment.created'));
    expect(ack).toBeTruthy();

    ws.close();
    await delay(50);
  }, 10000);
});

