/**
 * FileImportWizard Component
 * 
 * Wizard for importing data from CSV/JSON files into database tables.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Upload as UploadIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import connectorService, { type ImportJob } from '../../services/connectorService';

interface FileImportWizardProps {
  open: boolean;
  onClose: () => void;
  dataSourceId: string;
}

const steps = ['Upload File', 'Configure Import', 'Import Progress'];

export const FileImportWizard: React.FC<FileImportWizardProps> = ({
  open,
  onClose,
  dataSourceId,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState('');
  const [fileType, setFileType] = useState<'csv' | 'json'>('csv');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [batchSize, setBatchSize] = useState(1000);
  const [mode, setMode] = useState<'insert' | 'upsert' | 'replace'>('insert');
  const [importing, setImporting] = useState(false);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll for import job status
  useEffect(() => {
    if (!importJob || importJob.status === 'completed' || importJob.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updatedJob = await connectorService.getImportJob(importJob.id);
        setImportJob(updatedJob);
        
        if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Failed to fetch import job status:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [importJob]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-detect file type
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv') {
        setFileType('csv');
      } else if (extension === 'json') {
        setFileType('json');
      }
      
      // Auto-suggest table name from filename
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTableName(nameWithoutExt.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStartImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      // In a real implementation, you would upload the file first
      // For now, we'll assume the file is already on the server
      const result = await connectorService.startImport({
        dataSourceId,
        fileName: file.name,
        fileType,
        tableName,
        options: {
          batchSize,
          mode,
          delimiter: fileType === 'csv' ? delimiter : undefined,
          hasHeader: fileType === 'csv' ? hasHeader : undefined,
        },
      });

      // Fetch the job details
      const job = await connectorService.getImportJob(result.jobId);
      setImportJob(job);
      handleNext();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start import');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFile(null);
    setTableName('');
    setImportJob(null);
    setError(null);
    onClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV or JSON file to import data into your database.
            </Typography>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
            >
              {file ? file.name : 'Choose File'}
              <input
                type="file"
                hidden
                accept=".csv,.json"
                onChange={handleFileChange}
              />
            </Button>

            {file && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  File size: {(file.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Table Name"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              fullWidth
              required
              helperText="Name of the target table in the database"
            />

            <FormControl fullWidth>
              <InputLabel>Import Mode</InputLabel>
              <Select
                value={mode}
                label="Import Mode"
                onChange={(e) => setMode(e.target.value as any)}
              >
                <MenuItem value="insert">Insert (append new rows)</MenuItem>
                <MenuItem value="upsert">Upsert (update or insert)</MenuItem>
                <MenuItem value="replace">Replace (truncate and insert)</MenuItem>
              </Select>
            </FormControl>

            {fileType === 'csv' && (
              <>
                <TextField
                  label="Delimiter"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  fullWidth
                  helperText="Character used to separate values (e.g., comma, semicolon)"
                />

                <FormControl fullWidth>
                  <InputLabel>Has Header Row</InputLabel>
                  <Select
                    value={hasHeader ? 'yes' : 'no'}
                    label="Has Header Row"
                    onChange={(e) => setHasHeader(e.target.value === 'yes')}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            <TextField
              label="Batch Size"
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value))}
              fullWidth
              helperText="Number of rows to import per batch (1-10000)"
              inputProps={{ min: 1, max: 10000 }}
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {importJob && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">Status:</Typography>
                  <Chip
                    label={importJob.status.toUpperCase()}
                    color={
                      importJob.status === 'completed'
                        ? 'success'
                        : importJob.status === 'failed'
                        ? 'error'
                        : importJob.status === 'running'
                        ? 'primary'
                        : 'default'
                    }
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Progress: {importJob.progress.percentage}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={importJob.progress.percentage}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Rows
                    </Typography>
                    <Typography variant="h6">{importJob.progress.totalRows}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Processed
                    </Typography>
                    <Typography variant="h6">{importJob.progress.processedRows}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Successful
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {importJob.progress.successfulRows}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Failed
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {importJob.progress.failedRows}
                    </Typography>
                  </Box>
                </Box>

                {importJob.status === 'completed' && (
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    Import completed successfully!
                  </Alert>
                )}

                {importJob.status === 'failed' && (
                  <Alert severity="error">
                    Import failed. Please check the error details.
                  </Alert>
                )}
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Data from File</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}
      </DialogContent>
      <DialogActions>
        {activeStep === 2 && importJob?.status === 'completed' ? (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={importing}>
              Cancel
            </Button>
            {activeStep > 0 && activeStep < 2 && (
              <Button onClick={handleBack} disabled={importing}>
                Back
              </Button>
            )}
            {activeStep < 2 && (
              <Button
                onClick={activeStep === 1 ? handleStartImport : handleNext}
                variant="contained"
                disabled={
                  (activeStep === 0 && !file) ||
                  (activeStep === 1 && !tableName) ||
                  importing
                }
              >
                {activeStep === 1 ? 'Start Import' : 'Next'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

