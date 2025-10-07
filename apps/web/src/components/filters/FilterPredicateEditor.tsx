/**
 * Filter Predicate Editor Component
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Editor for a single filter predicate with field, operator, and value selection.
 */

import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { FilterPredicate, FilterOperator } from '../../stores/filtersSlice';
import { DateRangeFilter } from './DateRangeFilter';
import { NumericRangeFilter } from './NumericRangeFilter';
import { MultiSelectFilter } from './MultiSelectFilter';
import { TextFilter } from './TextFilter';
import filterService from '../../services/filterService';

interface FilterPredicateEditorProps {
  value: FilterPredicate;
  onChange: (predicate: FilterPredicate) => void;
  availableFields: Array<{ name: string; type: 'string' | 'number' | 'date' | 'boolean' }>;
}

/**
 * Filter Predicate Editor Component
 */
export const FilterPredicateEditor: React.FC<FilterPredicateEditorProps> = ({
  value,
  onChange,
  availableFields,
}) => {
  const selectedField = availableFields.find((f) => f.name === value.field);
  const fieldType = selectedField?.type || 'string';
  const availableOperators = filterService.getOperatorsForType(fieldType);

  /**
   * Handle field change
   */
  const handleFieldChange = (field: string) => {
    const newField = availableFields.find((f) => f.name === field);
    const newFieldType = newField?.type || 'string';
    const newOperators = filterService.getOperatorsForType(newFieldType);

    // Reset operator if current operator is not available for new field type
    const newOperator = newOperators.includes(value.operator)
      ? value.operator
      : newOperators[0];

    onChange({
      field,
      operator: newOperator,
      value: undefined,
      values: undefined,
      range: undefined,
    });
  };

  /**
   * Handle operator change
   */
  const handleOperatorChange = (operator: FilterOperator) => {
    onChange({
      ...value,
      operator,
      value: undefined,
      values: undefined,
      range: undefined,
    });
  };

  /**
   * Handle value change
   */
  const handleValueChange = (newValue: any) => {
    onChange({
      ...value,
      value: newValue,
    });
  };

  /**
   * Handle values change (for IN, NOT_IN)
   */
  const handleValuesChange = (newValues: any[]) => {
    onChange({
      ...value,
      values: newValues,
    });
  };

  /**
   * Handle range change (for BETWEEN)
   */
  const handleRangeChange = (min: any, max: any) => {
    onChange({
      ...value,
      range: { min, max },
    });
  };

  /**
   * Render value input based on operator and field type
   */
  const renderValueInput = () => {
    // Operators that don't require value input
    if (
      [
        FilterOperator.IS_NULL,
        FilterOperator.IS_NOT_NULL,
        FilterOperator.IS_TRUE,
        FilterOperator.IS_FALSE,
      ].includes(value.operator)
    ) {
      return null;
    }

    // IN and NOT_IN operators
    if ([FilterOperator.IN, FilterOperator.NOT_IN].includes(value.operator)) {
      return (
        <MultiSelectFilter
          value={value.values || []}
          onChange={handleValuesChange}
          fieldType={fieldType}
          label="Values"
        />
      );
    }

    // BETWEEN operator
    if (value.operator === FilterOperator.BETWEEN) {
      if (fieldType === 'date') {
        return (
          <DateRangeFilter
            value={value.range || { min: '', max: '' }}
            onChange={handleRangeChange}
          />
        );
      } else if (fieldType === 'number') {
        return (
          <NumericRangeFilter
            value={value.range || { min: 0, max: 100 }}
            onChange={handleRangeChange}
          />
        );
      }
    }

    // String operators with special handling
    if (
      fieldType === 'string' &&
      [
        FilterOperator.CONTAINS,
        FilterOperator.NOT_CONTAINS,
        FilterOperator.STARTS_WITH,
        FilterOperator.ENDS_WITH,
        FilterOperator.REGEX,
      ].includes(value.operator)
    ) {
      return (
        <TextFilter
          value={value.value || ''}
          onChange={handleValueChange}
          operator={value.operator}
          caseSensitive={value.caseSensitive}
          onCaseSensitiveChange={(caseSensitive) =>
            onChange({ ...value, caseSensitive })
          }
        />
      );
    }

    // Date input
    if (fieldType === 'date') {
      return (
        <TextField
          type="date"
          value={value.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      );
    }

    // Number input
    if (fieldType === 'number') {
      return (
        <TextField
          type="number"
          value={value.value || ''}
          onChange={(e) => handleValueChange(parseFloat(e.target.value))}
          size="small"
          fullWidth
          label="Value"
        />
      );
    }

    // Boolean input
    if (fieldType === 'boolean') {
      return (
        <FormControl size="small" fullWidth>
          <InputLabel>Value</InputLabel>
          <Select
            value={value.value === undefined ? '' : value.value.toString()}
            onChange={(e) => handleValueChange(e.target.value === 'true')}
            label="Value"
          >
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </Select>
        </FormControl>
      );
    }

    // Default text input
    return (
      <TextField
        value={value.value || ''}
        onChange={(e) => handleValueChange(e.target.value)}
        size="small"
        fullWidth
        label="Value"
      />
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Field Selector */}
      <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
        <InputLabel>Field</InputLabel>
        <Select
          value={value.field}
          onChange={(e) => handleFieldChange(e.target.value)}
          label="Field"
        >
          {availableFields.map((field) => (
            <MenuItem key={field.name} value={field.name}>
              {field.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Operator Selector */}
      <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
        <InputLabel>Operator</InputLabel>
        <Select
          value={value.operator}
          onChange={(e) => handleOperatorChange(e.target.value as FilterOperator)}
          label="Operator"
        >
          {availableOperators.map((op) => (
            <MenuItem key={op} value={op}>
              {filterService.getOperatorDisplayName(op)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Value Input */}
      <Box sx={{ minWidth: 200, flex: 2 }}>{renderValueInput()}</Box>
    </Box>
  );
};

