import { useEffect, useState } from 'react';
import websocketClient from '../services/websocketClient';
import { useAuth } from './useAuth';

export interface PresenceUpdate {
  type: 'presence.update';
  userId: string;
  dashboardId: string;
  cursorPosition?: any;
  at: number;
}

export function useCollabPresence(dashboardId: string) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<PresenceUpdate[]>([]);

  useEffect(() => {
    if (!user?.tenantId || !dashboardId) return;
    websocketClient.connect();

    const widgetId = 'collab';
    const topic = `collab:presence:tenant:${user.tenantId}:dashboard:${dashboardId}`;

    const unsub = websocketClient.onStatusChange((_status) => {
      // No-op — ensure client is connected
    });

    websocketClient.subscribe(widgetId, topic, (data: PresenceUpdate) => {
      if (data?.type === 'presence.update') {
        setUpdates((prev) => [data, ...prev].slice(0, 50));
      }
    });

    return () => {
      try { websocketClient.unsubscribe(widgetId, topic); } catch {}
      unsub?.();
    };
  }, [user?.tenantId, dashboardId]);

  // Helper to send presence via REST or WS could be added later
  return { updates };
}

