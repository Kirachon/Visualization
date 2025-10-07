import React, { useMemo, useState } from 'react';
import { Box, Chip, Divider, FormControlLabel, Paper, Stack, Switch, Typography } from '@mui/material';
import { useCollabComments } from '../../hooks/useCollabComments';
import { useCollabPresence } from '../../hooks/useCollabPresence';

export interface ActivityFeedProps {
  dashboardId: string;
}

type Activity = {
  when: number;
  type: 'comment.added' | 'presence.update';
  description: string;
  userId?: string;
};

function groupLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(Date.now() - 24 * 3600 * 1000);
  if (sameDay) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ dashboardId }) => {
  const { events: commentEvents } = useCollabComments(dashboardId);
  const { updates: presenceUpdates } = useCollabPresence(dashboardId);
  const [showComments, setShowComments] = useState(true);
  const [showPresence, setShowPresence] = useState(true);

  const activities = useMemo(() => {
    const cActs: Activity[] = showComments
      ? commentEvents.map((e) => ({ when: new Date(e.comment.createdAt).getTime(), type: 'comment.added', description: `New comment: ${e.comment.body.slice(0, 60)}`, userId: e.comment.userId }))
      : [];
    const pActs: Activity[] = showPresence
      ? presenceUpdates.map((p) => ({ when: p.at, type: 'presence.update', description: `Presence from ${p.userId}` , userId: p.userId }))
      : [];
    return [...cActs, ...pActs].sort((a, b) => b.when - a.when).slice(0, 200);
  }, [commentEvents, presenceUpdates, showComments, showPresence]);

  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      const g = groupLabel(a.when);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(a);
    }
    return Array.from(map.entries());
  }, [activities]);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, width: 360, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Activity</Typography>
        <Stack direction="row" spacing={1}>
          <FormControlLabel control={<Switch size="small" checked={showComments} onChange={(e) => setShowComments(e.target.checked)} />} label={<Typography variant="caption">Comments</Typography>} />
          <FormControlLabel control={<Switch size="small" checked={showPresence} onChange={(e) => setShowPresence(e.target.checked)} />} label={<Typography variant="caption">Presence</Typography>} />
        </Stack>
      </Stack>
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {grouped.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No activity yet.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {grouped.map(([label, items]) => (
              <Box key={label}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Chip size="small" label={label} />
                  <Divider sx={{ flex: 1 }} />
                </Stack>
                <Stack spacing={0.5}>
                  {items.map((a, idx) => (
                    <Typography key={`${label}-${idx}`} variant="body2">
                      {a.type === 'comment.added' ? '💬' : '👤'} {a.description}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

export default ActivityFeed;

