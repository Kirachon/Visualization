import React, { useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
// import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import type { QueryResult } from '../../services/dataSourceService';
import dataSourceService from '../../services/dataSourceService';
import type { DataBinding } from '../../types/dashboard';

import type { ChartConfig } from '../../types/charts';
import { getChartTheme } from '../../themes/chartThemes';
import { getPalette } from '../../utils/colorPalettes';
import { ChartStyleContext } from './ChartStyleContext';

export interface ChartContainerProps {
  bindings?: DataBinding;
  children: (args: { data: any[]; loading: boolean; error?: string }) => React.ReactNode;
  maxRows?: number; // to cap rendering cost
  // Chart foundation props (non-breaking; container decorates around children)
  config?: ChartConfig;
  themeName?: 'light' | 'dark' | 'high-contrast';
  paletteName?: string;
  liveMode?: boolean;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ bindings, children, maxRows = 1000, config, themeName = 'light', paletteName = 'categorical', liveMode: _liveMode = false }) => {

  const { t } = useTranslation();
  const [state, setState] = useState<{ loading: boolean; error?: string; data: any[] }>({
    loading: true,
    data: [],
  });

  const disabled = !bindings?.dataSourceId || !bindings?.query?.trim();

  const queryReq = useMemo(
    () => ({ sql: bindings?.query || '', limit: maxRows }),
    [bindings, maxRows],
  );

  useEffect(() => {
    let mounted = true;
    const ctl = new AbortController();
    (async () => {
      if (disabled) {
        setState({ loading: false, data: [], error: undefined });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: undefined }));
      try {
        const res: QueryResult = await dataSourceService.executeQuery(
          bindings!.dataSourceId,
          queryReq,
          { signal: ctl.signal },
        );
        if (!mounted) return;
        setState({
          loading: false,
          data: Array.isArray(res.rows) ? res.rows : [],
          error: undefined,
        });
      } catch (e: any) {
        if (!mounted) return;
        const safe = e?.response?.data?.error || t('errors.fetchFailed', 'Failed to fetch data');
        setState({ loading: false, data: [], error: safe });
      }
    })();
    return () => {
      mounted = false;
      ctl.abort();
    };
  }, [bindings?.dataSourceId, bindings?.query, queryReq, disabled, t]);

  if (disabled) {
    return (
      <Box role="note" aria-live="polite" sx={{ p: 2 }}>
        <Typography variant="body2">
          {t('charts.configureData', 'Configure data source and query')}
        </Typography>
      </Box>
    );
  }

  if (state.loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" sx={{ p: 3 }} aria-busy>
        <CircularProgress size={20} />
        <Typography variant="caption" sx={{ ml: 1 }}>
          {t('charts.loading', 'Loading...')}
        </Typography>
      </Box>
    );
  }

  if (state.error) {
    return (
      <Box role="alert" sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          {state.error}
        </Typography>
      </Box>
    );
  }

  if (!state.data?.length) {
    return (
      <Box role="status" aria-live="polite" sx={{ p: 2 }}>
        <Typography variant="body2">{t('charts.noData', 'No data')}</Typography>
      </Box>
    );
  }

  const chartTheme = getChartTheme(themeName);
  const palette = getPalette(paletteName);
  const aria = config?.ariaLabel || config?.title || t('charts.chart', 'Chart');

  return (
    <Box role="figure" aria-label={aria} data-theme={chartTheme.name} data-palette={paletteName}>
      <ChartStyleContext.Provider value={{ themeName: chartTheme.name, palette, ariaLabel: aria, grid: !!config?.grid }}>
        {children({ data: state.data, loading: false })}
      </ChartStyleContext.Provider>
    </Box>
  );
};

export default ChartContainer;
