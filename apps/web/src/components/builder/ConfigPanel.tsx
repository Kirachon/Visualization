import React from 'react';
import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { ComponentConfigBase } from '../../types/dashboard';

export interface ConfigPanelProps {
  component: ComponentConfigBase | null;
  onChange: (patch: Partial<ComponentConfigBase>) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ component, onChange }) => {
  if (!component) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" color="text.secondary">
          Select a component to configure
        </Typography>
      </Box>
    );
  }

  const isBindingMissing = !component.bindings?.dataSourceId || !component.bindings?.query?.trim();

  return (
    <Box sx={{ p: 2, width: 320 }} role="region" aria-label="Component configuration panel">
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Configuration
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Title"
          value={component.title || ''}
          inputProps={{ maxLength: 120 }}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <TextField
          label="Description"
          multiline
          minRows={2}
          value={component.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
        />
        <Divider />
        <Typography variant="subtitle2">Data Binding</Typography>
        <TextField
          label="Data Source ID"
          value={component.bindings?.dataSourceId || ''}
          onChange={(e) =>
            onChange({
              bindings: {
                dataSourceId: e.target.value,
                query: component.bindings?.query || '',
              },
            })
          }
        />
        <TextField
          label="SQL Query"
          multiline
          minRows={3}
          value={component.bindings?.query || ''}
          onChange={(e) =>
            onChange({
              bindings: {
                dataSourceId: component.bindings?.dataSourceId || '',
                query: e.target.value,
              },
            })
          }
          error={isBindingMissing}
          helperText={isBindingMissing ? 'Data source and query are required' : undefined}
          aria-invalid={isBindingMissing ? 'true' : 'false'}
        />
        <Divider />
        <Typography variant="subtitle2">Appearance</Typography>
        <FormControl fullWidth>
          <InputLabel>Color Scheme</InputLabel>
          <Select
            value={(component.options as any)?.colorScheme || 'default'}
            label="Color Scheme"
            onChange={(e) =>
              onChange({ options: { ...(component.options || {}), colorScheme: e.target.value } })
            }
          >
            <MenuItem value="default">Default</MenuItem>
            <MenuItem value="cool">Cool</MenuItem>
            <MenuItem value="warm">Warm</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};

export default ConfigPanel;
