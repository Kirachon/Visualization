import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import type { QueryResult } from '../../services/dataSourceService';
import dataSourceService from '../../services/dataSourceService';

interface QueryEditorProps {
  dataSourceId: string;
}

export const QueryEditor: React.FC<QueryEditorProps> = ({ dataSourceId }) => {
  const [sql, setSql] = useState('SELECT * FROM ');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [abortCtl, setAbortCtl] = useState<AbortController | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);
    setResult(null);
    const ctl = new AbortController();
    setAbortCtl(ctl);
    try {
      const data = await dataSourceService.executeQuery(
        dataSourceId,
        { sql, limit: 1000 },
        { signal: ctl.signal }
      );
      setResult(data);
      setPage(0);
    } catch (err: unknown) {
      if ((err as any)?.name === 'CanceledError' || (err as any)?.name === 'AbortError') {
        setError('Query canceled');
      } else {
        const message = (err as any)?.response?.data?.error || 'Query execution failed';
        setError(message);
      }
    } finally {
      setExecuting(false);
      setAbortCtl(null);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const columns = result && result.rows.length > 0 ? Object.keys(result.rows[0]) : [];
  const paginatedRows =
    result?.rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) || [];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={6}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="Enter SQL query..."
          variant="outlined"
          sx={{ fontFamily: 'monospace' }}
        />
      </Box>

      <Button
        variant="contained"
        startIcon={executing ? <CircularProgress size={20} /> : <PlayArrow />}
        onClick={handleExecute}
        disabled={executing || !sql.trim()}
      >
        {executing ? 'Executing...' : 'Execute Query'}
      </Button>
      {executing && (
        <Button sx={{ ml: 1 }} variant="outlined" color="warning" onClick={() => abortCtl?.abort()}>
          Cancel
        </Button>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              {result.rowCount} rows returned in {result.executionTime}ms
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {result.metadata?.engine && (
                <Box component="span" title="Execution engine" sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                  Engine: {result.metadata.engine.toUpperCase()}
                </Box>
              )}
              {result.metadata?.cacheHit !== undefined && (
                <Box component="span" title="Cache hit status" sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: result.metadata.cacheHit ? 'success.light' : 'action.hover' }}>
                  Cache: {result.metadata.cacheHit ? 'HIT' : 'MISS'}
                </Box>
              )}
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col}>
                      <strong>{col}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map((col) => (
                      <TableCell key={col}>
                        {row[col] !== null && row[col] !== undefined ? (
                          String(row[col])
                        ) : (
                          <em>NULL</em>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={result.rowCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Box>
      )}
    </Box>
  );
};

export default QueryEditor;
