import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle, Error, Warning } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../stores/store';
import {
  fetchDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
} from '../stores/dataSourceSlice';
import DataSourceForm from '../components/forms/DataSourceForm';
import type { DataSource, CreateDataSourceRequest } from '../services/dataSourceService';

export const DataSourceManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { dataSources, loading, error } = useSelector((state: RootState) => state.dataSource);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] = useState<DataSource | null>(null);

  useEffect(() => {
    dispatch(fetchDataSources());
  }, [dispatch]);

  const handleCreate = () => {
    setFormMode('create');
    setSelectedDataSource(null);
    setFormOpen(true);
  };

  const handleEdit = (dataSource: DataSource) => {
    setFormMode('edit');
    setSelectedDataSource(dataSource);
    setFormOpen(true);
  };

  const handleDelete = (dataSource: DataSource) => {
    setDataSourceToDelete(dataSource);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (dataSourceToDelete) {
      await dispatch(deleteDataSource(dataSourceToDelete.id));
      setDeleteDialogOpen(false);
      setDataSourceToDelete(null);
    }
  };

  const handleFormSubmit = async (data: CreateDataSourceRequest) => {
    if (formMode === 'create') {
      await dispatch(createDataSource(data));
    } else if (selectedDataSource) {
      await dispatch(updateDataSource({ id: selectedDataSource.id, data }));
    }
    setFormOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (loading && dataSources.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Data Sources</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
          Add Data Source
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {dataSources.map((dataSource) => (
          <Grid item xs={12} md={6} lg={4} key={dataSource.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="div">
                    {dataSource.name}
                  </Typography>
                  {getStatusIcon(dataSource.status)}
                </Box>

                <Chip
                  label={dataSource.status.toUpperCase()}
                  color={getStatusColor(dataSource.status)}
                  size="small"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary">
                  Type: {dataSource.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Host: {dataSource.connectionConfig.host}:{dataSource.connectionConfig.port}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Database: {dataSource.connectionConfig.database}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton size="small" onClick={() => handleEdit(dataSource)}>
                  <Edit />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(dataSource)}>
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {dataSources.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No data sources yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first data source to get started
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
            Add Data Source
          </Button>
        </Box>
      )}

      <DataSourceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        dataSource={selectedDataSource}
        mode={formMode}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Data Source</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{dataSourceToDelete?.name}"? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataSourceManager;
