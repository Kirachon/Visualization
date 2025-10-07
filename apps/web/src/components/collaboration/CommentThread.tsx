import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Divider, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CommentItem, { UIComment } from './CommentItem';
import { useCollabComments } from '../../hooks/useCollabComments';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';
import websocketClient from '../../services/websocketClient';

export interface MentionOption { id: string; label: string; username?: string; avatarUrl?: string }

export interface CommentThreadProps {
  dashboardId: string;
  workspaceId?: string;
  fetchMentionOptions?: () => Promise<MentionOption[]>;
}

const MAX_LEN = 5000;

const CommentThread: React.FC<CommentThreadProps> = ({ dashboardId, workspaceId, fetchMentionOptions }) => {
  const { user } = useAuth();
  const { events } = useCollabComments(dashboardId);

  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<UIComment[]>([]);
  const [body, setBody] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [mentionOpts, setMentionOpts] = useState<MentionOption[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const mentionAnchorRef = useRef<HTMLTextAreaElement | null>(null);

  const currentUserId = user?.id;

  // Load initial comments
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setInitialLoading(true);
        const res = await apiClient.get(`/comments`, { params: { dashboardId } });
        if (!active) return;
        const list: UIComment[] = (res.data || []).map((c: any) => ({
          id: c.id,
          dashboardId: c.dashboardId,
          userId: c.userId,
          body: c.body,
          mentions: c.mentions || [],
          resolved: !!c.resolved,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
        setComments(list);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load comments');
      } finally {
        setInitialLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [dashboardId]);

  // Merge realtime events
  useEffect(() => {
    if (!events.length) return;
    const newest = events[0];
    if (newest.type === 'comment.added') {
      const c = newest.comment;
      setComments((prev) => {
        if (prev.some((x) => x.id === c.id)) return prev; // avoid dupes
        return [...prev, { id: c.id, dashboardId: c.dashboardId, userId: c.userId, body: c.body, createdAt: c.createdAt }];
      });
    }
  }, [events]);

  // Mentions
  const loadMentionOptions = useCallback(async () => {
    try {
      if (fetchMentionOptions) {
        const opts = await fetchMentionOptions();
        setMentionOpts(opts);
        return;
      }
      if (workspaceId) {
        const res = await apiClient.get(`/workspaces/${workspaceId}/members`);
        const list: MentionOption[] = (res.data?.items || res.data || []).map((m: any) => ({ id: m.userId || m.id, label: m.displayName || m.username || m.email || m.userId || m.id }));
        setMentionOpts(list);
      }
    } catch {
      // silent failure — suggestions optional
    }
  }, [workspaceId, fetchMentionOptions]);

  useEffect(() => { loadMentionOptions(); }, [loadMentionOptions]);

  const filteredMentionOpts = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase().replace(/^@/, '');
    if (!q) return mentionOpts.slice(0, 8);
    return mentionOpts.filter((o) => (o.label || '').toLowerCase().includes(q)).slice(0, 8);
  }, [mentionQuery, mentionOpts]);

  const onBodyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setBody(v.slice(0, MAX_LEN));
    // Simple @-trigger detection
    const caret = (e.target as HTMLTextAreaElement).selectionStart || v.length;
    const tillCaret = v.slice(0, caret);
    const atIdx = tillCaret.lastIndexOf('@');
    if (atIdx >= 0 && (atIdx === 0 || /\s/.test(tillCaret[atIdx - 1]))) {
      setShowMentions(true);
      setMentionQuery(tillCaret.slice(atIdx + 1));
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (opt: MentionOption) => {
    if (!mentionAnchorRef.current) return;
    const el = mentionAnchorRef.current;
    const v = body;
    const caret = el.selectionStart || v.length;
    const tillCaret = v.slice(0, caret);
    const atIdx = tillCaret.lastIndexOf('@');
    const before = v.slice(0, atIdx);
    const after = v.slice(caret);
    const inserted = `@${opt.label}`;
    const next = `${before}${inserted}${after}`;
    setBody(next);
    setShowMentions(false);
    setMentionQuery('');
  };

  const onSubmit = async () => {
    setError(null);
    const trimmed = body.trim();
    if (!trimmed) return;
    const tempId = `tmp_${Date.now()}`;
    const optimistic: UIComment = {
      id: tempId,
      dashboardId,
      userId: currentUserId || 'me',
      body: trimmed,
      createdAt: new Date().toISOString(),
      isPending: true,
    };
    setComments((prev) => [...prev, optimistic]);

    // Try both WS and REST for reliability
    try {
      websocketClient.connect();
      websocketClient.publicCollabComment(dashboardId, trimmed, parentId, []);
    } catch {}

    try {
      await apiClient.post('/comments', { dashboardId, body: trimmed, mentions: [], parentId });
      // Let realtime event replace optimistic item; if not received in time, we keep the optimistic one which is harmless
      setBody('');
      setParentId(null);
    } catch (e: any) {
      // Rollback optimistic
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setError(e?.response?.data?.error || 'Failed to send comment');
    }
  };

  const onResolveToggle = async (commentId: string, toResolved: boolean) => {
    try {
      if (toResolved) {
        await apiClient.put(`/comments/${commentId}/resolve`);
      } else {
        await apiClient.put(`/comments/${commentId}/unresolve`);
      }
      // Update local state; server will also broadcast activity
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, resolved: toResolved } : c)));
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to update comment');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5, width: 360, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Comments</Typography>
      </Stack>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {initialLoading ? (
          <Typography variant="body2" color="text.secondary">Loading…</Typography>
        ) : comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} currentUserId={currentUserId} canEdit onResolveToggle={onResolveToggle} />
            ))}
          </Stack>
        )}
      </Box>
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField
          fullWidth
          multiline
          minRows={2}
          placeholder="Write a comment… Use @ to mention"
          value={body}
          onChange={onBodyChange}
          inputRef={mentionAnchorRef}
          inputProps={{ maxLength: MAX_LEN }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {body && (
                  <IconButton aria-label="Clear" size="small" onClick={() => setBody('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" endIcon={<SendIcon />} onClick={onSubmit} aria-label="Send comment">
          Send
        </Button>
      </Stack>
      {showMentions && filteredMentionOpts.length > 0 && (
        <Paper elevation={3} sx={{ position: 'absolute', mt: '-56px', width: 260, maxHeight: 220, overflowY: 'auto', p: 0.5 }}>
          {filteredMentionOpts.map((opt) => (
            <Box key={opt.id} sx={{ px: 1, py: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => insertMention(opt)}>
              <Typography variant="body2">@{opt.label}</Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Paper>
  );
};

export default CommentThread;

