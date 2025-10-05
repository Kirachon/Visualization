import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../stores/store';
import userService from '../services/userService';

const UserProfile: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMsg(null);
    try {
      await userService.update(user.id, { firstName, lastName, email });
      setMsg('Profile updated');
    } catch (e: any) {
      setMsg(e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component={Paper} sx={{ p: 3, maxWidth: 600 }} aria-label="User Profile">
      <Typography variant="h5" gutterBottom>
        My Profile
      </Typography>
      <Stack spacing={2}>
        <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </Stack>
        {msg && (
          <Typography variant="body2" color="text.secondary" role="status">
            {msg}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default UserProfile;

