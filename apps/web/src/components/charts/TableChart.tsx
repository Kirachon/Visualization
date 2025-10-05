import React, { useMemo, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface TableChartProps {
  data: any[];
  pageSize?: number;
  title?: string;
}

const TableChart: React.FC<TableChartProps> = ({ data, pageSize = 25, title }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const columns = useMemo(() => (data[0] ? Object.keys(data[0]) : []), [data]);
  const total = data.length;
  const rows = useMemo(
    () => data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [data, page, rowsPerPage],
  );

  if (!data?.length)
    return (
      <Box role="status" aria-live="polite" sx={{ p: 2 }}>
        <Typography variant="body2">{t('charts.noData', 'No data')}</Typography>
      </Box>
    );

  return (
    <Box>
      <TableContainer>
        <Table size="small" aria-label={title || t('charts.table', 'Table')}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c} sx={{ fontWeight: 600 }}>
                  {c}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={idx}>
                {columns.map((c) => (
                  <TableCell key={c}>{String(r[c])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_e, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage={t('charts.rowsPerPage', 'Rows per page:')}
      />
    </Box>
  );
};

export default TableChart;
