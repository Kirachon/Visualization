/**
 * useLiveData Hook
 * Story 2.4: Real-time Dashboard Updates
 *
 * React hook for subscribing to live data updates via WebSocket.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketClient, ConnectionStatus } from '../services/websocketClient';

export interface UseLiveDataOptions {
  /**
   * Widget ID for subscription
   */
  widgetId: string;

  /**
   * Topic to subscribe to
   */
  topic: string;

  /**
   * Whether live mode is enabled
   */
  enabled?: boolean;

  /**
   * Callback when data is received
   */
  onData?: (data: any) => void;

  /**
   * Callback when connection status changes
   */
  onStatusChange?: (status: ConnectionStatus) => void;
}

export interface UseLiveDataResult {
  /**
   * Latest data received
   */
  data: any | null;

  /**
   * Connection status
   */
  status: ConnectionStatus;

  /**
   * Last update timestamp
   */
  lastUpdated: Date | null;

  /**
   * Whether currently connected
   */
  isConnected: boolean;

  /**
   * Whether currently reconnecting
   */
  isReconnecting: boolean;

  /**
   * Connect to WebSocket
   */
  connect: () => void;

  /**
   * Disconnect from WebSocket
   */
  disconnect: () => void;
}

/**
 * Hook for subscribing to live data updates
 */
export function useLiveData(options: UseLiveDataOptions): UseLiveDataResult {
  const { widgetId, topic, enabled = true, onData, onStatusChange } = options;

  const [data, setData] = useState<any | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(websocketClient.getStatus());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const onDataRef = useRef(onData);
  const onStatusChangeRef = useRef(onStatusChange);

  // Update refs
  useEffect(() => {
    onDataRef.current = onData;
    onStatusChangeRef.current = onStatusChange;
  }, [onData, onStatusChange]);

  /**
   * Handle data update
   */
  const handleData = useCallback(
    (newData: any) => {
      setData(newData);
      setLastUpdated(new Date());

      if (onDataRef.current) {
        onDataRef.current(newData);
      }
    },
    []
  );

  /**
   * Handle status change
   */
  const handleStatusChange = useCallback(
    (newStatus: ConnectionStatus) => {
      setStatus(newStatus);

      if (onStatusChangeRef.current) {
        onStatusChangeRef.current(newStatus);
      }
    },
    []
  );

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    websocketClient.connect();
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    websocketClient.disconnect();
  }, []);

  /**
   * Subscribe to live updates
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Connect if not already connected
    if (websocketClient.getStatus() === ConnectionStatus.DISCONNECTED) {
      websocketClient.connect();
    }

    // Subscribe to topic
    websocketClient.subscribe(widgetId, topic, handleData);

    // Subscribe to status changes
    const unsubscribeStatus = websocketClient.onStatusChange(handleStatusChange);

    // Cleanup
    return () => {
      websocketClient.unsubscribe(widgetId, topic);
      unsubscribeStatus();
    };
  }, [widgetId, topic, enabled, handleData, handleStatusChange]);

  return {
    data,
    status,
    lastUpdated,
    isConnected: status === ConnectionStatus.CONNECTED,
    isReconnecting: status === ConnectionStatus.RECONNECTING,
    connect,
    disconnect,
  };
}
