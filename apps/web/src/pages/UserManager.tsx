import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../stores/store';
import { fetchUsers, createUser, updateUser, deleteUser } from '../stores/userSlice';
import UserForm, { UserFormValues } from '../components/forms/UserForm';

const ROLES = [
  { id: 'admin', name: 'Admin' },
  { id: 'viewer', name: 'Viewer' },
];

const UserManager: React.FC = () => {
  const dispatch = useDispatch();
  const { items, total } = useSelector((s: RootState) => s.users);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUsers({ q, page: page + 1, pageSize: rowsPerPage }) as any);
  }, [dispatch, q, page, rowsPerPage]);

  const editingUser = useMemo(() => items.find((u) => u.id === editingId), [items, editingId]);

  const handleCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    if (editingId) {
      await dispatch(updateUser({ id: editingId, body: { email: values.email, firstName: values.firstName, lastName: values.lastName, roleId: values.roleId } }) as any);
    } else {
      await dispatch(createUser({ username: values.username!, email: values.email, password: values.password!, firstName: values.firstName, lastName: values.lastName, roleId: values.roleId }) as any);
    }
    setDialogOpen(false);
    setEditingId(null);
    dispatch(fetchUsers({ q, page: page + 1, pageSize: rowsPerPage }) as any);
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteUser(id) as any);
    dispatch(fetchUsers({ q, page: page + 1, pageSize: rowsPerPage }) as any);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">User Management</Typography>
        <Box display="flex" gap={2}>
          <TextField size="small" placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} aria-label="Add User">
            New User
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} aria-label="Users table">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.firstName} {u.lastName}</TableCell>
                <TableCell>{u.role?.name}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton aria-label={`Edit ${u.username}`} onClick={() => handleEdit(u.id)} size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton aria-label={`Delete ${u.username}`} onClick={() => handleDelete(u.id)} size="small" color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_e, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />

      <UserForm open={dialogOpen} title={editingId ? 'Edit User' : 'Create User'} roles={ROLES} initial={editingUser || undefined} onClose={() => { setDialogOpen(false); setEditingId(null); }} onSubmit={handleSubmit} />
    </Box>
  );
};

export default UserManager;

