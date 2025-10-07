import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow, Stack } from '@mui/material';
import { fetchCacheStats, fetchEngineSplit, fetchSlowQueries, CacheStats, EngineSplit, SlowQuery } from '../services/perfService';

const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n/1024).toFixed(1)} KB`;
  return `${(n/1024/1024).toFixed(1)} MB`;
};

const PerformanceDashboard: React.FC = () => {
  const [cache, setCache] = useState<CacheStats | null>(null);
  const [split, setSplit] = useState<EngineSplit | null>(null);
  const [slow, setSlow] = useState<SlowQuery[]>([]);

  const load = async () => {
    const [c, e, s] = await Promise.all([
      fetchCacheStats(),
      fetchEngineSplit(3600000),
      fetchSlowQueries(3600000),
    ]);
    setCache(c); setSplit(e); setSlow(s);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Performance Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Cache</Typography>
            <Stack spacing={1}>
              <Typography>Hit Rate: {cache ? formatPct(cache.hitRate) : '—'}</Typography>
              <LinearProgress variant="determinate" value={(cache?.hitRate || 0) * 100} />
              <Typography variant="body2">Items: {cache?.items ?? '—'} | Size: {cache ? formatBytes(cache.size) : '—'}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Engine Split (last 1h)</Typography>
            <Stack spacing={1}>
              <Typography>OLAP: {split?.counts.olap ?? 0} ({split ? formatPct(split.pctOlap) : '—'})</Typography>
              <LinearProgress variant="determinate" value={(split?.pctOlap || 0) * 100} />
              <Typography variant="body2">OLTP: {split?.counts.oltp ?? 0} | Total: {split?.total ?? 0}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Top Slow Queries (last 1h)</Typography>
            <Table size="small" aria-label="slow-queries">
              <TableHead>
                <TableRow>
                  <TableCell>SQL Hash</TableCell>
                  <TableCell align="right">Duration (ms)</TableCell>
                  <TableCell align="right">When</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slow.map((q) => (
                  <TableRow key={`${q.sqlHash}-${q.at}`}>
                    <TableCell>{q.sqlHash}</TableCell>
                    <TableCell align="right">{q.durationMs}</TableCell>
                    <TableCell align="right">{new Date(q.at).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
                {slow.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceDashboard;

