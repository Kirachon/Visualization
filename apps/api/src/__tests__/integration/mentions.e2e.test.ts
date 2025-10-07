import request from 'supertest';
// Mock notificationService so dynamic import in commentService picks this up
jest.mock('../../services/notificationService.js', () => ({ notificationService: { notifyMentions: jest.fn() } }));
import { app } from '../../server.js';

jest.setTimeout(20000);

describe('Mentions notification (E2E-ish)', () => {
  async function login(username: string, password: string) {
    const server = app; // supertest can use the express app directly
    const agent = request(server);
    const res = await agent.post('/api/v1/auth/login').send({ username, password });
    expect(res.status).toBe(200);
    const token = res.body.token as string;
    return { agent, token };
  }

  beforeEach(() => {
    jest.restoreAllMocks();
    delete (process.env as any).COMMENTS_MENTIONS_NOTIFY;
    delete (process.env as any).TEST_ENABLE_MENTION_NOTIFS;
    // Clear mock call history
    const { notificationService } = require('../../services/notificationService.js');
    (notificationService.notifyMentions as jest.Mock).mockClear();
  });

  it('calls notificationService when feature flag enabled (test opt-in)', async () => {
    process.env.COMMENTS_MENTIONS_NOTIFY = 'true';
    process.env.TEST_ENABLE_MENTION_NOTIFS = 'true';

    const { notificationService } = require('../../services/notificationService.js');

    const { agent, token } = await login('admin', 'admin123');

    const res = await agent
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ dashboardId: 'd1', body: 'Hello @viewer', mentions: ['test-viewer'] });

    expect(res.status).toBe(201);
    expect(notificationService.notifyMentions).toHaveBeenCalledTimes(1);
    expect(notificationService.notifyMentions).toHaveBeenCalledWith(expect.any(String), 'd1', expect.any(String), ['test-viewer'], expect.any(String));
  });

  it('does not call notificationService when feature flag disabled', async () => {
    process.env.COMMENTS_MENTIONS_NOTIFY = 'false';
    process.env.TEST_ENABLE_MENTION_NOTIFS = 'true';

    const { notificationService } = require('../../services/notificationService.js');

    const { agent, token } = await login('admin', 'admin123');

    const res = await agent
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ dashboardId: 'd2', body: 'No notify', mentions: ['test-viewer'] });

    expect(res.status).toBe(201);
    expect(notificationService.notifyMentions).not.toHaveBeenCalled();
  });
});

