import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from '@mui/material';
import type { User } from '@/types';

export interface UserFormValues {
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  password?: string; // only for create
}

interface Props {
  open: boolean;
  title: string;
  initial?: Partial<User>;
  roles: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
}

const UserForm: React.FC<Props> = ({ open, title, initial, roles, onClose, onSubmit }) => {
  const [values, setValues] = useState<UserFormValues>({
    username: initial?.username || '',
    email: initial?.email || '',
    firstName: initial?.firstName || '',
    lastName: initial?.lastName || '',
    roleId: (initial as any)?.role?.id || '',
  });

  useEffect(() => {
    setValues({
      username: initial?.username || '',
      email: initial?.email || '',
      firstName: initial?.firstName || '',
      lastName: initial?.lastName || '',
      roleId: (initial as any)?.role?.id || '',
    });
  }, [initial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="user-form-title">
      <DialogTitle id="user-form-title">{title}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={(e) => e.preventDefault()} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {initial?.id ? null : (
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Username" name="username" value={values.username} onChange={handleChange} required />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" name="email" type="email" value={values.email} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="First Name" name="firstName" value={values.firstName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Last Name" name="lastName" value={values.lastName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Role" name="roleId" value={values.roleId} onChange={handleChange} required>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {!initial?.id && (
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Password" name="password" type="password" value={values.password || ''} onChange={handleChange} required />
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;

