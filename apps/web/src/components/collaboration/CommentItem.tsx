import React, { useMemo } from 'react';
import { Avatar, Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

export type UIComment = {
  id: string;
  dashboardId: string;
  userId: string;
  body: string;
  mentions?: string[];
  resolved?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  isPending?: boolean; // optimistic UI placeholder
};

export interface CommentItemProps {
  comment: UIComment;
  currentUserId?: string;
  canEdit?: boolean;
  onResolveToggle?: (commentId: string, toResolved: boolean) => Promise<void> | void;
}

function highlightMentions(text: string) {
  // Very simple @mention highlighter; production-ready backend already sanitizes HTML on save
  const parts = text.split(/(\@[a-zA-Z0-9_\-]+)/g);
  return parts.map((p, i) => {
    if (p.startsWith('@')) {
      return (
        <Typography key={i} component="span" color="primary" sx={{ fontWeight: 600 }}>
          {p}
        </Typography>
      );
    }
    return (
      <Typography key={i} component="span">
        {p}
      </Typography>
    );
  });
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId, canEdit, onResolveToggle }) => {
  const isAuthor = useMemo(() => currentUserId && comment.userId && currentUserId === comment.userId, [currentUserId, comment.userId]);

  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ opacity: comment.isPending ? 0.6 : 1 }}>
      <Avatar sx={{ width: 28, height: 28 }}>{(comment.userId || '?').slice(0, 2).toUpperCase()}</Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ mr: 1 }}>
            {comment.userId}
          </Typography>
          {comment.resolved ? (
            <Chip size="small" color="success" label="Resolved" />
          ) : (
            <Chip size="small" variant="outlined" label="Open" />
          )}
          {comment.isPending && (
            <Chip size="small" color="warning" variant="outlined" label="Sending..." />
          )}
        </Stack>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {highlightMentions(comment.body)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(comment.createdAt).toLocaleString()}
        </Typography>
      </Box>
      <Box>
        <Tooltip title={comment.resolved ? 'Unresolve' : 'Resolve'}>
          <span>
            <IconButton
              size="small"
              onClick={() => onResolveToggle?.(comment.id, !comment.resolved)}
              disabled={!canEdit && !isAuthor}
              aria-label={comment.resolved ? 'Unresolve comment' : 'Resolve comment'}
            >
              {comment.resolved ? (
                <CheckCircleOutlineIcon fontSize="small" color="success" />
              ) : (
                <RadioButtonUncheckedIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        {/* Edit/Delete actions are intentionally omitted because backend lacks endpoints.
            They can be enabled when update/delete APIs are available. */}
      </Box>
    </Stack>
  );
};

export default CommentItem;

