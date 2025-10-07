/**
 * Text Filter Component
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Text search with operator selection (contains, starts with, ends with, regex).
 */

import React from 'react';
import { Box, TextField, FormControlLabel, Checkbox, Alert } from '@mui/material';
import { FilterOperator } from '../../stores/filtersSlice';

interface TextFilterProps {
  value: string;
  onChange: (value: string) => void;
  operator: FilterOperator;
  caseSensitive?: boolean;
  onCaseSensitiveChange?: (caseSensitive: boolean) => void;
}

/**
 * Text Filter Component
 */
export const TextFilter: React.FC<TextFilterProps> = ({
  value,
  onChange,
  operator,
  caseSensitive = false,
  onCaseSensitiveChange,
}) => {
  const [regexError, setRegexError] = React.useState<string | null>(null);

  /**
   * Validate regex pattern
   */
  const validateRegex = (pattern: string) => {
    if (operator !== FilterOperator.REGEX) {
      setRegexError(null);
      return;
    }

    if (!pattern) {
      setRegexError(null);
      return;
    }

    try {
      new RegExp(pattern);
      setRegexError(null);
    } catch (e: any) {
      setRegexError(e.message);
    }
  };

  /**
   * Handle value change
   */
  const handleChange = (newValue: string) => {
    onChange(newValue);
    validateRegex(newValue);
  };

  /**
   * Get placeholder text based on operator
   */
  const getPlaceholder = () => {
    switch (operator) {
      case FilterOperator.CONTAINS:
        return 'Enter text to search for...';
      case FilterOperator.NOT_CONTAINS:
        return 'Enter text to exclude...';
      case FilterOperator.STARTS_WITH:
        return 'Enter prefix...';
      case FilterOperator.ENDS_WITH:
        return 'Enter suffix...';
      case FilterOperator.REGEX:
        return 'Enter regular expression...';
      default:
        return 'Enter value...';
    }
  };

  /**
   * Get helper text based on operator
   */
  const getHelperText = () => {
    if (operator === FilterOperator.REGEX) {
      return 'Use JavaScript regex syntax (e.g., ^[A-Z].*$ for strings starting with uppercase)';
    }
    return undefined;
  };

  React.useEffect(() => {
    validateRegex(value);
  }, [value, operator]);

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        size="small"
        fullWidth
        label="Value"
        placeholder={getPlaceholder()}
        helperText={getHelperText()}
        error={!!regexError}
        multiline={operator === FilterOperator.REGEX}
        rows={operator === FilterOperator.REGEX ? 2 : 1}
      />

      {/* Case Sensitive Option */}
      {onCaseSensitiveChange && (
        <FormControlLabel
          control={
            <Checkbox
              checked={caseSensitive}
              onChange={(e) => onCaseSensitiveChange(e.target.checked)}
              size="small"
            />
          }
          label="Case sensitive"
          sx={{ mt: 0.5 }}
        />
      )}

      {/* Regex Error */}
      {regexError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Invalid regex pattern: {regexError}
        </Alert>
      )}

      {/* Regex Examples */}
      {operator === FilterOperator.REGEX && !regexError && value && (
        <Alert severity="info" sx={{ mt: 1 }}>
          <strong>Examples:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            <li>
              <code>^[A-Z]</code> - Starts with uppercase letter
            </li>
            <li>
              <code>\d{'{3}'}-\d{'{4}'}</code> - Phone number pattern (XXX-XXXX)
            </li>
            <li>
              <code>.*@example\.com$</code> - Ends with @example.com
            </li>
          </ul>
        </Alert>
      )}
    </Box>
  );
};

