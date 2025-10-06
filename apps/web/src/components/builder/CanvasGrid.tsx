import React from 'react';
import type { Layout } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';
import { Box, IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../stores/store';
import { removeComponent, updateLayout } from '../../stores/builderSlice';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export interface CanvasGridProps {
  layout: Layout[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  renderItem: (id: string) => React.ReactNode;
  editable?: boolean;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({
  layout,
  selectedId,
  onSelect,
  renderItem,
  editable = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const toLayoutItems = (next: Layout[]) =>
    next.map((l) => ({
      i: String(l.i),
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
      minW: l.minW,
      minH: l.minH,
      maxW: l.maxW,
      maxH: l.maxH,
      static: l.static,
    }));

  const onDragStop = (nextLayout: Layout[]) => {
    dispatch(updateLayout(toLayoutItems(nextLayout)));
  };

  const onResizeStop = (nextLayout: Layout[]) => {
    dispatch(updateLayout(toLayoutItems(nextLayout)));
  };

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={30}
      width={1200}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
      isBounded
      isDroppable={false}
      isDraggable={editable}
      isResizable={editable}
      draggableHandle=".drag-handle"
    >
      {layout.map((l) => (
        <div
          key={l.i}
          data-grid={l as any}
          onClick={() => onSelect(l.i)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(l.i);
            }
          }}
        >
          <Paper
            tabIndex={0}
            aria-label={`Component ${l.i}`}
            sx={{
              height: '100%',
              outline: selectedId === l.i ? '2px solid #1976d2' : 'none',
              position: 'relative',
              p: 1,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Delete') dispatch(removeComponent(String(l.i)));
            }}
          >
            <Box
              className="drag-handle"
              sx={{ cursor: 'move', mb: 1, userSelect: 'none' }}
              aria-label="Drag handle"
            />
            {editable && (
              <IconButton
                aria-label="Remove component"
                size="small"
                onClick={() => dispatch(removeComponent(String(l.i)))}
                sx={{ position: 'absolute', top: 4, right: 4 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
            {renderItem(String(l.i))}
          </Paper>
        </div>
      ))}
    </GridLayout>
  );
};

export default CanvasGrid;
