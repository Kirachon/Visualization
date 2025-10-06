import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, CircularProgress, Alert } from '@mui/material';

import { Storage, TableChart, ViewColumn } from '@mui/icons-material';
import type { SchemaTable } from '../../services/dataSourceService';
import dataSourceService from '../../services/dataSourceService';

interface SchemaExplorerProps {
  dataSourceId: string;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({ dataSourceId }) => {
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadSchema = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataSourceService.discoverSchema(dataSourceId);
      setSchema(data);
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.error || 'Failed to load schema';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dataSourceId]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  const filteredSchema = schema.filter(
    (table) =>
      table.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.schemaName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const groupedBySchema = filteredSchema.reduce(
    (acc, table) => {
      if (!acc[table.schemaName]) {
        acc[table.schemaName] = [];
      }
      acc[table.schemaName].push(table);
      return acc;
    },
    {} as Record<string, SchemaTable[]>,
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search tables..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box role="tree" aria-label="Schema Explorer">
        {Object.entries(groupedBySchema).map(([schemaName, tables]) => (
          <Box key={schemaName} role="treeitem" aria-expanded aria-level={1} sx={{ mb: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Storage fontSize="small" />
              <Typography>{schemaName}</Typography>
            </Box>
            <Box role="group" sx={{ ml: 3, mt: 0.5 }}>
              {tables.map((table) => (
                <Box
                  key={`${schemaName}.${table.tableName}`}
                  role="treeitem"
                  aria-expanded
                  aria-level={2}
                  sx={{ mb: 0.5 }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <TableChart fontSize="small" />
                    <Typography>{table.tableName}</Typography>
                  </Box>
                  <Box role="group" sx={{ ml: 3, mt: 0.25 }}>
                    {table.columns.map((column) => (
                      <Box
                        key={`${schemaName}.${table.tableName}.${column.columnName}`}
                        role="treeitem"
                        aria-level={3}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <ViewColumn fontSize="small" />
                        <Typography variant="body2">
                          {column.columnName} ({column.dataType}){!column.isNullable && ' NOT NULL'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SchemaExplorer;
