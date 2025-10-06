import React, { useState } from 'react';
import { Box, Chip, TextField, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../stores/store';
import { addGlobalFilter, clearGlobalFilters } from '../../stores/filtersSlice';

export const GlobalFiltersBar: React.FC = () => {
  const dispatch = useDispatch();
  const filters = useSelector((s: RootState) => s.filters?.globals || []);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1 }}>
      <TextField size="small" label="Field" value={key} onChange={(e) => setKey(e.target.value)} />
      <TextField size="small" label="Value" value={value} onChange={(e) => setValue(e.target.value)} />
      <Button
        size="small"
        variant="contained"
        onClick={() => {
          if (!key || !value) return;
          dispatch(addGlobalFilter({ key, op: 'eq', value }));
          setKey('');
          setValue('');
        }}
      >
        Add filter
      </Button>
      <Button size="small" onClick={() => dispatch(clearGlobalFilters())}>Clear</Button>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {filters.map((f, idx) => (
          <Chip key={idx} label={`${f.key}=${String(f.value)}`} />
        ))}
      </Box>
    </Box>
  );
};

export default GlobalFiltersBar;

