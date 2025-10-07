import React from 'react';
import { Avatar, AvatarGroup, Tooltip } from '@mui/material';
import { useCollabPresence } from '../../hooks/useCollabPresence';

interface Props {
  dashboardId: string;
  max?: number;
}

export const PresenceAvatars: React.FC<Props> = ({ dashboardId, max = 5 }) => {
  const { updates } = useCollabPresence(dashboardId);
  const latestByUser = new Map<string, typeof updates[number]>();
  updates.forEach((u) => { if (!latestByUser.has(u.userId)) latestByUser.set(u.userId, u); });
  const users = Array.from(latestByUser.values()).slice(0, max);

  return (
    <AvatarGroup max={max} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 12 } }}>
      {users.map((u) => (
        <Tooltip key={u.userId} title={`User ${u.userId}`}>
          <Avatar>{u.userId.slice(0, 2).toUpperCase()}</Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
  );
};

export default PresenceAvatars;

