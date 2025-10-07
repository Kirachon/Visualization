import { useEffect, useState } from 'react';
import websocketClient from '../services/websocketClient';
import { useAuth } from './useAuth';

export interface CommentEvent {
  type: 'comment.added';
  comment: {
    id: string;
    dashboardId: string;
    userId: string;
    body: string;
    createdAt: string;
  }
}

export function useCollabComments(dashboardId: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CommentEvent[]>([]);

  useEffect(() => {
    if (!user?.tenantId || !dashboardId) return;
    websocketClient.connect();

    const widgetId = 'collab';
    const topic = `collab:comments:tenant:${user.tenantId}:dashboard:${dashboardId}`;

    websocketClient.subscribe(widgetId, topic, (data: CommentEvent) => {
      if (data?.type === 'comment.added') {
        setEvents((prev) => [data, ...prev].slice(0, 100));
      }
    });

    return () => {
      try { websocketClient.unsubscribe(widgetId, topic); } catch {}
    };
  }, [user?.tenantId, dashboardId]);

  return { events };
}

