import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import type { AppDispatch, RootState } from '../stores/store';
import { fetchDashboardById } from '../stores/dashboardsSlice';
import {
  addComponent,
  markSaved,
  selectComponent,
  setInitial,
  setSaving,
  setSaveError,
  undoAction,
  redoAction,
  updateComponent,
} from '../stores/builderSlice';
import type { ComponentConfigBase, DashboardDefinition } from '../types/dashboard';
import CanvasGrid from '../components/builder/CanvasGrid';
import Palette from '../components/builder/Palette';
import ConfigPanel from '../components/builder/ConfigPanel';
import ErrorBoundary from '../components/builder/ErrorBoundary';
import ShareIndicator from '../components/builder/ShareIndicator';
import ShareDialog from '../components/dashboard/ShareDialog';
import { ChartContainer, BarChart, LineChart, PieChart, TableChart } from '../components/charts';
import dashboardService from '../services/dashboardService';

function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

const DashboardEditPage: React.FC = () => {
  const [shareOpen, setShareOpen] = useState(false);

  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const dashboard = useSelector((s: RootState) => (id ? s.dashboards.byId[id] : undefined));
  const builder = useSelector((s: RootState) => s.builder);
  const userId = useSelector((s: RootState) => s.auth.user?.id);
  const canEdit = !!dashboard && userId === dashboard.meta.ownerId;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await dispatch(fetchDashboardById(id) as any);
      if ((res as any).meta.requestStatus === 'fulfilled') {
        const def = (res as any).payload as DashboardDefinition;
        dispatch(setInitial(def));
      }
    })();
  }, [dispatch, id]);

  const debouncedSave = useDebouncedCallback(async (def: DashboardDefinition) => {
    try {
      dispatch(setSaving(true));
      await dashboardService.patch(def.id, {
        layout: def.layout,
        components: def.components,
        version: def.version,
      });
      dispatch(markSaved());
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to save dashboard';
      dispatch(setSaveError(msg));
    }
  }, 800);

  useEffect(() => {
    if (!builder.history) return;
    if (!builder.dirty) return;
    debouncedSave(builder.history.present);
  }, [builder.history, builder.dirty, debouncedSave]);

  const onAdd = () => {
    const newId = `c_${Date.now()}`;
    dispatch(addComponent({ type: 'bar', layout: { i: newId, x: 0, y: Infinity, w: 4, h: 6 } }));
  };

  const selected = useMemo(() => {
    if (!builder.history || !builder.selectedId) return null;
    return builder.history.present.components.find((c) => c.id === builder.selectedId) || null;
  }, [builder.history, builder.selectedId]);

  const onConfigChange = (patch: Partial<ComponentConfigBase>) => {
    if (!builder.selectedId) return;
    dispatch(updateComponent({ id: builder.selectedId, patch }));
  };

  if (!dashboard || !builder.history) {
    return (
      <Box display="flex" justifyContent="center" p={6}>
        <CircularProgress />
      </Box>
    );
  }

  const layout = builder.history.present.layout as any;

  return (
    <ErrorBoundary>
      <Stack direction="row" spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ flex: 1 }} noWrap aria-live="polite">
              {dashboard.meta.name}
            </Typography>
            <ShareIndicator dashboardId={dashboard.id} initialShared={dashboard.meta.isShared} />
            {canEdit && (
              <Button variant="outlined" size="small" onClick={() => setShareOpen(true)} aria-label="Open Share Dialog">
                Share
              </Button>
            )}
            {!canEdit && (
              <Typography variant="caption" color="warning.main" role="status" aria-live="polite">
                Read-only (insufficient permissions)
              </Typography>
            )}
            <Button variant="outlined" onClick={() => navigate('/dashboards')}>
              Back
            </Button>
            <Button
              variant="text"
              onClick={() => dispatch(undoAction())}
              disabled={!builder.history?.past?.length || !canEdit}
            >
              Undo
            </Button>
            <Button
              variant="text"
              onClick={() => dispatch(redoAction())}
              disabled={!builder.history?.future?.length || !canEdit}
            >
              Redo
            </Button>
            <Button variant="contained" onClick={onAdd} disabled={!canEdit}>
              Add Component
            </Button>
          </Stack>
          <Palette
            onAdd={(type) => {
              const newId = `c_${Date.now()}`;
              dispatch(addComponent({ type, layout: { i: newId, x: 0, y: Infinity, w: 4, h: 6 } }));
            }}
          />
          <Divider sx={{ my: 2 }} />
          <CanvasGrid
            layout={layout}
            selectedId={builder.selectedId}
            onSelect={(cid) => dispatch(selectComponent(cid))}
            renderItem={(cid) => {
              const c = builder.history?.present.components.find((x) => x.id === cid);
              if (!c) return null;
              const bindings = c.bindings;
              const title = c.title || c.type.toUpperCase();
              return (
                <ChartContainer bindings={bindings}>
                  {({ data }) => {
                    switch (c.type) {
                      case 'bar':
                        return <BarChart data={data} title={title} />;
                      case 'line':
                        return <LineChart data={data} title={title} />;
                      case 'pie':
                        return <PieChart data={data} title={title} />;
                      case 'table':
                        return <TableChart data={data} title={title} />;
                      default:
                        return <Box sx={{ p: 1 }}>{title}</Box>;
                    }
                  }}
                </ChartContainer>
              );
            }}
            editable={canEdit}
          />
        </Box>
        <Divider orientation="vertical" flexItem />
        <ConfigPanel component={selected} onChange={onConfigChange} />
      {canEdit && (
        <ShareDialog dashboardId={dashboard.id} open={shareOpen} onClose={() => setShareOpen(false)} />
      )}

      </Stack>
    </ErrorBoundary>
  );
};

export default DashboardEditPage;
