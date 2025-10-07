/**
 * Global Filters Bar Component
 * Story 2.3: Advanced Filtering & Cross-Filtering
 *
 * Enhanced global filters bar with advanced filter builder, saved filter sets, and filter chips.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Drawer,
  Typography,
  Chip,
  Stack,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../stores/store';
import {
  setGlobalFilters,
  clearGlobalFilters,
  setFilterSets,
  addFilterSet,
  removeFilterSet,
  setActiveFilterSet,
  FilterConfig,
  FilterPredicate,
} from '../../stores/filtersSlice';
import { AdvancedFilterBuilder } from './AdvancedFilterBuilder';
import filterService from '../../services/filterService';

/**
 * Global Filters Bar Component
 */
export const GlobalFiltersBar: React.FC = () => {
  const dispatch = useDispatch();
  const globalFilters = useSelector((s: RootState) => s.filters?.globalFilters);
  const filterSets = useSelector((s: RootState) => s.filters?.filterSets || []);
  const activeFilterSetId = useSelector((s: RootState) => s.filters?.activeFilterSetId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadMenuAnchor, setLoadMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterSetName, setFilterSetName] = useState('');
  const [filterSetDescription, setFilterSetDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Mock available fields (in production, this would come from the data source)
  const availableFields = [
    { name: 'name', type: 'string' as const },
    { name: 'age', type: 'number' as const },
    { name: 'email', type: 'string' as const },
    { name: 'created_at', type: 'date' as const },
    { name: 'is_active', type: 'boolean' as const },
  ];

  /**
   * Load saved filter sets on mount
   */
  useEffect(() => {
    loadFilterSets();
  }, []);

  /**
   * Load filter sets from API
   */
  const loadFilterSets = async () => {
    try {
      const response = await filterService.listFilterSets();
      dispatch(setFilterSets(response.items.map(fs => ({
        id: fs.id,
        name: fs.name,
        description: fs.description,
        predicates: fs.predicates,
        isGlobal: fs.isGlobal,
      }))));
    } catch (error) {
      console.error('Failed to load filter sets:', error);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (config: FilterConfig) => {
    dispatch(setGlobalFilters(config));
    dispatch(setActiveFilterSet(undefined)); // Clear active filter set when manually editing
  };

  /**
   * Handle save filter set
   */
  const handleSaveFilterSet = async () => {
    if (!filterSetName.trim()) {
      setSaveError('Filter set name is required');
      return;
    }

    try {
      const newFilterSet = await filterService.createFilterSet({
        name: filterSetName.trim(),
        description: filterSetDescription.trim() || undefined,
        predicates: globalFilters,
        isGlobal: false,
      });

      dispatch(addFilterSet({
        id: newFilterSet.id,
        name: newFilterSet.name,
        description: newFilterSet.description,
        predicates: newFilterSet.predicates,
        isGlobal: newFilterSet.isGlobal,
      }));

      setSaveDialogOpen(false);
      setFilterSetName('');
      setFilterSetDescription('');
      setSaveError(null);
    } catch (error: any) {
      setSaveError(error.message);
    }
  };

  /**
   * Handle load filter set
   */
  const handleLoadFilterSet = (filterSetId: string) => {
    const filterSet = filterSets.find(fs => fs.id === filterSetId);
    if (filterSet) {
      dispatch(setGlobalFilters(filterSet.predicates));
      dispatch(setActiveFilterSet(filterSetId));
    }
    setLoadMenuAnchor(null);
  };

  /**
   * Handle delete filter set
   */
  const handleDeleteFilterSet = async (filterSetId: string) => {
    try {
      await filterService.deleteFilterSet(filterSetId);
      dispatch(removeFilterSet(filterSetId));
      if (activeFilterSetId === filterSetId) {
        dispatch(setActiveFilterSet(undefined));
      }
    } catch (error) {
      console.error('Failed to delete filter set:', error);
    }
  };

  /**
   * Get filter summary text
   */
  const getFilterSummary = (): string => {
    const count = globalFilters?.predicates?.length || 0;
    if (count === 0) return 'No filters';
    return `${count} filter${count !== 1 ? 's' : ''}`;
  };

  /**
   * Get predicate display text
   */
  const getPredicateText = (predicate: FilterPredicate): string => {
    const operatorName = filterService.getOperatorDisplayName(predicate.operator);
    let valueText = '';

    if (predicate.values) {
      valueText = predicate.values.join(', ');
    } else if (predicate.range) {
      valueText = `${predicate.range.min} - ${predicate.range.max}`;
    } else if (predicate.value !== undefined) {
      valueText = String(predicate.value);
    }

    return `${predicate.field} ${operatorName}${valueText ? ` ${valueText}` : ''}`;
  };

  return (
    <>
      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        {/* Filter Button */}
        <Button
          variant={globalFilters?.predicates?.length ? 'contained' : 'outlined'}
          startIcon={<FilterIcon />}
          onClick={() => setDrawerOpen(true)}
          size="small"
        >
          {getFilterSummary()}
        </Button>

        {/* Active Filter Set Indicator */}
        {activeFilterSetId && (
          <Chip
            label={`Set: ${filterSets.find(fs => fs.id === activeFilterSetId)?.name}`}
            size="small"
            color="primary"
            onDelete={() => dispatch(setActiveFilterSet(undefined))}
          />
        )}

        {/* Filter Chips */}
        {globalFilters?.predicates && globalFilters.predicates.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ flex: 1, overflow: 'auto' }}>
            {globalFilters.predicates.slice(0, 3).map((predicate, index) => (
              <Chip
                key={index}
                label={getPredicateText(predicate as FilterPredicate)}
                size="small"
                variant="outlined"
              />
            ))}
            {globalFilters.predicates.length > 3 && (
              <Chip
                label={`+${globalFilters.predicates.length - 3} more`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          {globalFilters?.predicates?.length > 0 && (
            <>
              <Tooltip title="Save filter set">
                <IconButton size="small" onClick={() => setSaveDialogOpen(true)}>
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear filters">
                <IconButton size="small" onClick={() => dispatch(clearGlobalFilters())}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {filterSets.length > 0 && (
            <Tooltip title="Load filter set">
              <IconButton size="small" onClick={(e) => setLoadMenuAnchor(e.currentTarget)}>
                <LoadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Filter Builder Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 600, md: 800 } } }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filter Configuration</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <AdvancedFilterBuilder
              value={globalFilters}
              onChange={handleFilterChange}
              availableFields={availableFields}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)}>Close</Button>
            <Button variant="contained" onClick={() => setDrawerOpen(false)}>
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Save Filter Set Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Filter Set</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Name"
            fullWidth
            value={filterSetName}
            onChange={(e) => setFilterSetName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={filterSetDescription}
            onChange={(e) => setFilterSetDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveFilterSet} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Filter Set Menu */}
      <Menu
        anchorEl={loadMenuAnchor}
        open={Boolean(loadMenuAnchor)}
        onClose={() => setLoadMenuAnchor(null)}
      >
        {filterSets.map((filterSet) => (
          <MenuItem
            key={filterSet.id}
            onClick={() => handleLoadFilterSet(filterSet.id)}
            selected={filterSet.id === activeFilterSetId}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Box>
                <Typography variant="body2">{filterSet.name}</Typography>
                {filterSet.description && (
                  <Typography variant="caption" color="text.secondary">
                    {filterSet.description}
                  </Typography>
                )}
              </Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFilterSet(filterSet.id);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default GlobalFiltersBar;
