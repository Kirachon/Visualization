import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import type { DataSource, CreateDataSourceRequest } from '../../services/dataSourceService';
import dataSourceService from '../../services/dataSourceService';

interface DataSourceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDataSourceRequest) => Promise<void>;
  dataSource?: DataSource | null;
  mode: 'create' | 'edit';
}

export const DataSourceForm: React.FC<DataSourceFormProps> = ({
  open,
  onClose,
  onSubmit,
  dataSource,
  mode,
}) => {
  const [formData, setFormData] = useState<CreateDataSourceRequest>({
    name: dataSource?.name || '',
    type: 'postgresql',
    connectionConfig: {
      host: dataSource?.connectionConfig?.host || '',
      port: dataSource?.connectionConfig?.port || 5432,
      database: dataSource?.connectionConfig?.database || '',
      username: dataSource?.connectionConfig?.username || '',
      password: '',
      ssl: dataSource?.connectionConfig?.ssl || false,
    },
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('connectionConfig.')) {
      const configField = field.split('.')[1];
      setFormData({
        ...formData,
        connectionConfig: {
          ...formData.connectionConfig,
          [configField]: value,
        },
      });
    } else {
      // Update default port when type changes
      if (field === 'type') {
        const defaultPorts: Record<string, number> = {
          postgresql: 5432,
          mysql: 3306,
          mssql: 1433,
          oracle: 1521,
          mongodb: 27017,
          cassandra: 9042,
          clickhouse: 8123,
        };
        setFormData({
          ...formData,
          [field]: value,
          connectionConfig: {
            ...formData.connectionConfig,
            port: defaultPorts[value] || formData.connectionConfig.port,
          },
        });
      } else {
        setFormData({
          ...formData,
          [field]: value,
        });
      }
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await dataSourceService.testConnection(formData.type, formData.connectionConfig);
      setTestResult({
        success: result.ok,
        message: result.ok ? 'Connection successful!' : result.message || 'Connection failed',
      });
    } catch (error: unknown) {
      const message = (error as any)?.response?.data?.error || 'Connection test failed';
      setTestResult({
        success: false,
        message: message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Create Data Source' : 'Edit Data Source'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
          />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <MenuItem value="postgresql">PostgreSQL</MenuItem>
              <MenuItem value="mysql">MySQL</MenuItem>
              <MenuItem value="mssql" disabled>SQL Server (coming soon)</MenuItem>
              <MenuItem value="oracle" disabled>Oracle (coming soon)</MenuItem>
              <MenuItem value="mongodb" disabled>MongoDB (coming soon)</MenuItem>
              <MenuItem value="cassandra" disabled>Cassandra (coming soon)</MenuItem>
              <MenuItem value="clickhouse" disabled>ClickHouse (coming soon)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Host"
            value={formData.connectionConfig.host}
            onChange={(e) => handleChange('connectionConfig.host', e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Port"
            type="number"
            value={formData.connectionConfig.port}
            onChange={(e) => handleChange('connectionConfig.port', parseInt(e.target.value))}
            fullWidth
            required
          />

          <TextField
            label="Database"
            value={formData.connectionConfig.database}
            onChange={(e) => handleChange('connectionConfig.database', e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Username"
            value={formData.connectionConfig.username}
            onChange={(e) => handleChange('connectionConfig.username', e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Password"
            type="password"
            value={formData.connectionConfig.password}
            onChange={(e) => handleChange('connectionConfig.password', e.target.value)}
            fullWidth
            required={mode === 'create'}
            helperText={mode === 'edit' ? 'Leave blank to keep existing password' : ''}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.connectionConfig.ssl}
                onChange={(e) => handleChange('connectionConfig.ssl', e.target.checked)}
              />
            }
            label="Use SSL"
          />

          <Button
            variant="outlined"
            onClick={handleTestConnection}
            disabled={
              testing || !formData.connectionConfig.host || !formData.connectionConfig.database
            }
            startIcon={testing && <CircularProgress size={20} />}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>

          {testResult && (
            <Alert severity={testResult.success ? 'success' : 'error'}>{testResult.message}</Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !formData.name || !formData.connectionConfig.host}
          startIcon={submitting && <CircularProgress size={20} />}
        >
          {submitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DataSourceForm;
