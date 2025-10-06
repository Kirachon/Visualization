import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import { Add, Delete, Search } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../stores/store';
import { deleteDashboard, fetchDashboards, setPage, setQuery } from '../stores/dashboardsSlice';
import { useNavigate } from 'react-router-dom';

const DashboardListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, total, page, pageSize, loading, q } = useSelector((s: RootState) => s.dashboards);
  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    dispatch(fetchDashboards({ q, page, pageSize }));
  }, [dispatch, q, page, pageSize]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setPage(1));
    dispatch(setQuery(localQ));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Dashboards</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/dashboards/new')}>
          Create Dashboard
        </Button>
      </Box>

      <Box component="form" onSubmit={onSearch} sx={{ mb: 2 }} aria-label="Dashboard search form">
        <TextField
          fullWidth
          size="small"
          placeholder="Search dashboards"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} role="list">
          {items.map((d) => (
            <Grid item xs={12} md={6} lg={4} key={d.id} role="listitem">
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ mr: 2, minWidth: 0 }}>
                  <Typography variant="h6" noWrap title={d.name}>
                    {d.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap title={d.description}>
                    {d.description}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {d.tags?.slice(0, 3).map((t) => (
                      <Chip key={t} label={t} size="small" />
                    ))}
                    {d.isShared && <Chip label="Shared" size="small" color="info" />}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/dashboards/${d.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <IconButton
                    aria-label={`Delete dashboard ${d.name}`}
                    color="error"
                    onClick={() => dispatch(deleteDashboard(d.id))}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={pageCount}
          page={page}
          onChange={(_, v) => dispatch(setPage(v))}
          aria-label="Dashboards pagination"
        />
      </Box>
    </Box>
  );
};

export default DashboardListPage;
