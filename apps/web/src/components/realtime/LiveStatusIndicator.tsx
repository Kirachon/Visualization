/**
 * Live Status Indicator Component
 * Story 2.4: Real-time Dashboard Updates
 * 
 * Visual indicator showing live connection status and last update time.
 */

import React, { useState, useEffect } from 'react';
import { Chip, Tooltip, CircularProgress } from '@mui/material';
import {
  FiberManualRecord as LiveIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { ConnectionStatus, websocketClient } from '../../services/websocketClient';

interface LiveStatusIndicatorProps {
  lastUpdated?: Date;
  mode?: 'live' | 'manual' | 'interval';
  interval?: number; // in seconds
}

/**
 * Live Status Indicator Component
 */
export const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({
  lastUpdated,
  mode = 'manual',
  interval,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    websocketClient.getStatus()
  );

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = websocketClient.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    return unsubscribe;
  }, []);

  /**
   * Get status label
   */
  const getStatusLabel = (): string => {
    if (mode === 'manual') {
      return 'Manual';
    }

    if (mode === 'interval' && interval) {
      return `Every ${interval}s`;
    }

    // Live mode
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'Live';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.RECONNECTING:
        return 'Reconnecting...';
      case ConnectionStatus.ERROR:
        return 'Error';
      case ConnectionStatus.DISCONNECTED:
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (): 'success' | 'warning' | 'error' | 'default' => {
    if (mode !== 'live') {
      return 'default';
    }

    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'success';
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return 'warning';
      case ConnectionStatus.ERROR:
        return 'error';
      default:
        return 'default';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (): React.ReactElement => {
    if (mode === 'manual') {
      return <RefreshIcon />;
    }

    if (mode === 'interval') {
      return <RefreshIcon />;
    }

    // Live mode
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return <LiveIcon />;
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return <CircularProgress size={16} />;
      case ConnectionStatus.ERROR:
        return <ErrorIcon />;
      default:
        return <LiveIcon />;
    }
  };

  /**
   * Get tooltip text
   */
  const getTooltipText = (): string => {
    const parts: string[] = [];

    // Status
    parts.push(`Status: ${getStatusLabel()}`);

    // Last updated
    if (lastUpdated) {
      const timeAgo = getTimeAgo(lastUpdated);
      parts.push(`Last updated: ${timeAgo}`);
    }

    // Mode-specific info
    if (mode === 'live') {
      if (connectionStatus === ConnectionStatus.CONNECTED) {
        parts.push('Receiving real-time updates');
      } else if (connectionStatus === ConnectionStatus.RECONNECTING) {
        parts.push('Attempting to reconnect...');
      } else if (connectionStatus === ConnectionStatus.ERROR) {
        parts.push('Connection error - check network');
      }
    } else if (mode === 'interval' && interval) {
      parts.push(`Auto-refreshing every ${interval} seconds`);
    } else {
      parts.push('Click refresh to update');
    }

    return parts.join('\n');
  }

  /**
   * Get time ago string
   */
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Tooltip title={getTooltipText()} arrow>
      <Chip
        icon={getStatusIcon()}
        label={getStatusLabel()}
        size="small"
        color={getStatusColor()}
        variant={mode === 'live' && connectionStatus === ConnectionStatus.CONNECTED ? 'filled' : 'outlined'}
        sx={{
          animation:
            mode === 'live' && connectionStatus === ConnectionStatus.CONNECTED
              ? 'pulse 2s ease-in-out infinite'
              : 'none',
          '@keyframes pulse': {
            '0%, 100%': {
              opacity: 1,
            },
            '50%': {
              opacity: 0.7,
            },
          },
        }}
      />
    </Tooltip>
  );
};

