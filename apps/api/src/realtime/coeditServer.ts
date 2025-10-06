import type { Server } from 'http';

// COEDIT_ENABLED (default OFF): when true and this is attached to the HTTP server,
// starts a Yjs websocket server for collaborative editing using y-websocket protocol.
// This module is safe to import in environments where ws/ports are restricted; do not auto-start.

export async function attachCoeditServer(httpServer: Server) {
  if ((process.env.COEDIT_ENABLED || 'false').toLowerCase() !== 'true') return;
  const { setupWSConnection } = await import('y-websocket/bin/utils.js');
  const { WebSocketServer } = await import('ws');

  const wss = new WebSocketServer({ server: httpServer, path: '/coedit' });
  wss.on('connection', (ws: any, req: any) => {
    // TODO: add auth (e.g., token/cookie), room sharding, rate limits
    setupWSConnection(ws as any, req as any, { gc: true });
  });
  // eslint-disable-next-line no-console
  console.log('[COEDIT] y-websocket attached at /coedit');
}

