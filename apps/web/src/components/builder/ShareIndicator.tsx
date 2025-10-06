import React, { useEffect, useState } from 'react';
import { Tooltip, Chip } from '@mui/material';
import dashboardService from '../../services/dashboardService';

interface ShareIndicatorProps {
  dashboardId: string;
  initialShared?: boolean;
}

const ShareIndicator: React.FC<ShareIndicatorProps> = ({ dashboardId, initialShared }) => {
  const [isShared, setIsShared] = useState<boolean>(!!initialShared);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Prefer meta flag; if absent, fetch shares to determine
        const res = await dashboardService.listShares?.(dashboardId);
        if (!mounted) return;
        if (res && Array.isArray(res)) setIsShared(res.length > 0);
      } catch {
        // ignore; fall back to initial
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dashboardId]);

  if (!isShared) return null;

  return (
    <Tooltip title="This dashboard is shared">
      <Chip size="small" label="Shared" color="info" />
    </Tooltip>
  );
};

export default ShareIndicator;
