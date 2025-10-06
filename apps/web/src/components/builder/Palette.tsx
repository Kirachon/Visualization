import React from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import classNames from 'classnames';

const types = [
  { type: 'bar', label: 'Bar' },
  { type: 'line', label: 'Line' },
  { type: 'pie', label: 'Pie' },
  { type: 'table', label: 'Table' },
] as const;

export interface PaletteProps {
  onAdd: (type: 'bar' | 'line' | 'pie' | 'table') => void;
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
