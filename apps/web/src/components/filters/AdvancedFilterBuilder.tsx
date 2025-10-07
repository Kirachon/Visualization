/**
 * Advanced Filter Builder Component
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Main filter builder with AND/OR group support, add/remove predicates, operator selection.
 */

import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { FilterConfig, FilterPredicate, FilterOperator, LogicalOperator } from '../../stores/filtersSlice';
import { FilterPredicateEditor } from './FilterPredicateEditor';

interface AdvancedFilterBuilderProps {
  value: FilterConfig;
  onChange: (config: FilterConfig) => void;
  availableFields?: Array<{ name: string; type: 'string' | 'number' | 'date' | 'boolean' }>;
}

/**
 * Advanced Filter Builder Component
 */
export const AdvancedFilterBuilder: React.FC<AdvancedFilterBuilderProps> = ({
  value,
  onChange,
  availableFields = [],
}) => {

  /**
   * Handle logical operator change
   */
  const handleOperatorChange = (operator: LogicalOperator) => {
    onChange({
      ...value,
      operator,
    });
  };

  /**
   * Add a new predicate
   */
  const handleAddPredicate = () => {
    const newPredicate: FilterPredicate = {
      field: availableFields[0]?.name || '',
      operator: FilterOperator.EQ,
      value: '',
    };

    onChange({
      ...value,
      predicates: [...value.predicates, newPredicate],
    });
  };

  /**
   * Update a predicate
   */
  const handleUpdatePredicate = (index: number, predicate: FilterPredicate) => {
    const newPredicates = [...value.predicates];
    newPredicates[index] = predicate;

    onChange({
      ...value,
      predicates: newPredicates,
    });
  };

  /**
   * Remove a predicate
   */
  const handleRemovePredicate = (index: number) => {
    const newPredicates = value.predicates.filter((_, i) => i !== index);

    onChange({
      ...value,
      predicates: newPredicates,
    });
  };

  /**
   * Clear all predicates
   */
  const handleClearAll = () => {
    onChange({
      ...value,
      predicates: [],
    });
  };

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6">Advanced Filters</Typography>
          {value.predicates.length > 0 && (
            <Chip
              label={`${value.predicates.length} filter${value.predicates.length !== 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {value.predicates.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleClearAll}
              startIcon={<DeleteIcon />}
            >
              Clear All
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            onClick={handleAddPredicate}
            startIcon={<AddIcon />}
            disabled={availableFields.length === 0}
          >
            Add Filter
          </Button>
        </Box>
      </Box>

      {/* Logical Operator Selector */}
      {value.predicates.length > 1 && (
        <Box sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Match</InputLabel>
            <Select
              value={value.operator || LogicalOperator.AND}
              onChange={(e) => handleOperatorChange(e.target.value as LogicalOperator)}
              label="Match"
            >
              <MenuItem value={LogicalOperator.AND}>All (AND)</MenuItem>
              <MenuItem value={LogicalOperator.OR}>Any (OR)</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            {value.operator === LogicalOperator.AND
              ? 'All conditions must be true'
              : 'At least one condition must be true'}
          </Typography>
        </Box>
      )}

      {/* Predicates List */}
      {value.predicates.length === 0 ? (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            color: 'text.secondary',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <FilterIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
          <Typography variant="body2">
            No filters applied. Click "Add Filter" to get started.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {value.predicates.map((predicate, index) => (
            <Box key={index}>
              {index > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Chip
                    label={value.operator === LogicalOperator.AND ? 'AND' : 'OR'}
                    size="small"
                    sx={{ mx: 2 }}
                  />
                  <Divider sx={{ flex: 1 }} />
                </Box>
              )}

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <FilterPredicateEditor
                      value={predicate as FilterPredicate}
                      onChange={(updated) => handleUpdatePredicate(index, updated)}
                      availableFields={availableFields}
                    />
                  </Box>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemovePredicate(index)}
                    aria-label="Remove filter"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            </Box>
          ))}
        </Stack>
      )}

      {/* Summary */}
      {value.predicates.length > 0 && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Active Filters:</strong> {value.predicates.length} condition
            {value.predicates.length !== 1 ? 's' : ''} using{' '}
            <strong>{value.operator === LogicalOperator.AND ? 'AND' : 'OR'}</strong> logic
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

