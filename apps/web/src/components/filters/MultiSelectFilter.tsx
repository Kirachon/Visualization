/**
 * Multi-Select Filter Component
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Multi-select dropdown with search for IN and NOT_IN operators.
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Chip,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

interface MultiSelectFilterProps {
  value: any[];
  onChange: (values: any[]) => void;
  fieldType: 'string' | 'number' | 'date' | 'boolean';
  label?: string;
}

/**
 * Multi-Select Filter Component
 */
export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  value,
  onChange,
  fieldType,
  label = 'Values',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [, setShowSuggestions] = useState(false);

  /**
   * Add a value
   */
  const handleAddValue = () => {
    if (!inputValue.trim()) return;

    let parsedValue: any = inputValue.trim();

    // Parse value based on field type
    if (fieldType === 'number') {
      parsedValue = parseFloat(inputValue);
      if (isNaN(parsedValue)) {
        return; // Invalid number
      }
    } else if (fieldType === 'boolean') {
      parsedValue = inputValue.toLowerCase() === 'true';
    }

    // Check for duplicates
    if (value.includes(parsedValue)) {
      return;
    }

    onChange([...value, parsedValue]);
    setInputValue('');
  };

  /**
   * Remove a value
   */
  const handleRemoveValue = (index: number) => {
    const newValues = value.filter((_, i) => i !== index);
    onChange(newValues);
  };

  /**
   * Handle key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddValue();
    }
  };

  /**
   * Get input type based on field type
   */
  const getInputType = () => {
    switch (fieldType) {
      case 'number':
        return 'number';
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Input Field */}
      <TextField
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        type={getInputType()}
        size="small"
        fullWidth
        label={label}
        placeholder={`Add ${fieldType} value...`}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleAddValue}
                disabled={!inputValue.trim()}
                edge="end"
              >
                <AddIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Selected Values */}
      {value.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {value.map((val, index) => (
            <Chip
              key={index}
              label={String(val)}
              size="small"
              onDelete={() => handleRemoveValue(index)}
              deleteIcon={<CloseIcon />}
            />
          ))}
        </Box>
      )}

      {/* Value Count */}
      {value.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {value.length} value{value.length !== 1 ? 's' : ''} selected
        </Typography>
      )}

      {/* Empty State */}
      {value.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          No values added yet. Type a value and press Enter or click the + button.
        </Typography>
      )}
    </Box>
  );
};

