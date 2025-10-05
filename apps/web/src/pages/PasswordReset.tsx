import React, { useState } from 'react';
import { Box, Button, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import userService from '../services/userService';

const PasswordReset: React.FC = () => {
  const [tab, setTab] = useState(0); // 0-initiate, 1-complete

  // Initiate
  const [email, setEmail] = useState('');
  const [initMsg, setInitMsg] = useState<string | null>(null);

  // Complete
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [completeMsg, setCompleteMsg] = useState<string | null>(null);

  const initiate = async () => {
    setInitMsg(null);
    try {
      await userService.initiatePasswordReset(email);
      setInitMsg('If the email exists, a reset link has been sent.');
    } catch (e: any) {
      setInitMsg(e?.message || 'Failed to initiate reset');
    }
  };

  const complete = async () => {
    setCompleteMsg(null);
    try {
      await userService.completePasswordReset(token, password);
      setCompleteMsg('Password has been reset. You can now log in.');
    } catch (e: any) {
      setCompleteMsg(e?.message || 'Failed to complete reset');
    }
  };

  return (
    <Box component={Paper} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Password Reset
      </Typography>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} aria-label="Password reset tabs">
        <Tab label="Request Reset" />
        <Tab label="Complete Reset" />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={2} mt={2} aria-label="Password reset request form">
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <Button variant="contained" onClick={initiate}>Send Reset Link</Button>
          {initMsg && <Typography variant="body2" role="status">{initMsg}</Typography>}
        </Stack>
      )}

      {tab === 1 && (
        <Stack spacing={2} mt={2} aria-label="Password reset completion form">
          <TextField label="Reset Token" value={token} onChange={(e) => setToken(e.target.value)} fullWidth />
          <TextField label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
          <Button variant="contained" onClick={complete}>Reset Password</Button>
          {completeMsg && <Typography variant="body2" role="status">{completeMsg}</Typography>}
        </Stack>
      )}
    </Box>
  );
};

export default PasswordReset;

