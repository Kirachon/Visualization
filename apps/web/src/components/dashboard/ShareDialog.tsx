import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import dashboardService, { ShareRequest } from '../../services/dashboardService';
import userService from '../../services/userService';

interface Props {
  dashboardId: string;
  open: boolean;
  onClose: () => void;
}

const ShareDialog: React.FC<Props> = ({ dashboardId, open, onClose }) => {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; username: string; email: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await userService.list({ q, page: 1, pageSize: 10 });
        if (!mounted) return;
        setUsers(res.items);
      } catch (e: any) {
        setError(e?.message || 'Failed to load users');
      }
    })();
    return () => { mounted = false; };
  }, [q]);

  const canShare = useMemo(() => !!selectedUserId, [selectedUserId]);

  const handleShare = async () => {
    const body: ShareRequest = { userId: selectedUserId, permissionType: permission };
    await dashboardService.share(dashboardId, body);
    onClose();
  };

  const handlePublicLink = async () => {
    const res = await dashboardService.generatePublicLink(dashboardId);
    setPublicLink(res.url || res.token);
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="share-dialog-title" fullWidth maxWidth="sm">
      <DialogTitle id="share-dialog-title">Share Dashboard</DialogTitle>
      <DialogContent>
        {error && <Typography color="error" variant="body2">{error}</Typography>}
        <Box display="flex" gap={2} my={2}>
          <TextField fullWidth label="Search user" value={q} onChange={(e) => setQ(e.target.value)} />
          <FormControl fullWidth>
            <InputLabel id="permission-label">Permission</InputLabel>
            <Select labelId="permission-label" label="Permission" value={permission} onChange={(e) => setPermission(e.target.value as any)}>
              <MenuItem value="view">View</MenuItem>
              <MenuItem value="edit">Edit</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <FormControl fullWidth>
          <InputLabel id="user-select-label">User</InputLabel>
          <Select labelId="user-select-label" label="User" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value as string)}>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.username} ({u.email})</MenuItem>
            ))}
          </Select>
        </FormControl>
        {publicLink && (
          <Box mt={2}>
            <Typography variant="body2">Public Link:</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{publicLink}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handlePublicLink} variant="outlined">Generate Public Link</Button>
        <Button onClick={onClose} variant="text">Cancel</Button>
        <Button onClick={handleShare} variant="contained" disabled={!canShare}>Share</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;

