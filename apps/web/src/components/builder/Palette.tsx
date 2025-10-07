import React from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import classNames from 'classnames';

const types = [
  { type: 'bar', label: 'Bar', category: 'Basic' },
  { type: 'line', label: 'Line', category: 'Basic' },
  { type: 'area', label: 'Area', category: 'Basic' },
  { type: 'pie', label: 'Pie', category: 'Basic' },
  { type: 'donut', label: 'Donut', category: 'Basic' },
  { type: 'scatter', label: 'Scatter', category: 'Basic' },
  { type: 'stackedBar', label: 'Stacked Bar', category: 'Basic' },
  { type: 'histogram', label: 'Histogram', category: 'Statistical' },
  { type: 'table', label: 'Table', category: 'Data' },
] as const;

export interface PaletteProps {
  onAdd: (
    type:
      | 'bar'
      | 'line'
      | 'area'
      | 'pie'
      | 'donut'
      | 'scatter'
      | 'stackedBar'
      | 'histogram'
      | 'table',
  ) => void;
}

const Palette: React.FC<PaletteProps> = ({ onAdd }) => {
  return (
    <Box
      role="toolbar"
      aria-label="Component palette"
      sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
    >
      {types.map((t) => (
        <ButtonBase
          key={t.type}
          onClick={() => onAdd(t.type)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAdd(t.type);
            }
          }}
          className={classNames('palette-item')}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.25,
            minWidth: 72,
          }}
          aria-label={`Add ${t.label} component`}
        >
          <Typography variant="body2">{t.label}</Typography>
        </ButtonBase>
      ))}
    </Box>
  );
};

export default Palette;
