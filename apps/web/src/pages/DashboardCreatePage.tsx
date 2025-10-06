import React, { useState } from 'react';
import { Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../stores/store';
import { createDashboard } from '../stores/dashboardsSlice';
import { useNavigate } from 'react-router-dom';

const DashboardCreatePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const onAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const onRemoveTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await dispatch(createDashboard({ name, description, tags }) as any);
    if ((res as any).meta.requestStatus === 'fulfilled') {
      navigate('/dashboards');
    }
  };

  return (
    <Paper sx={{ p: 3 }} component="form" onSubmit={onSubmit}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Create Dashboard
      </Typography>
      <Stack spacing={2}>
        <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="Description"
          multiline
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Tags
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
            {tags.map((t) => (
              <Chip key={t} label={t} onDelete={() => onRemoveTag(t)} />
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
            />
            <Button variant="outlined" onClick={onAddTag}>
              Add
            </Button>
          </Stack>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Permissions will be managed in Sharing (Story 1.5); indicator only.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained">
            Create
          </Button>
          <Button variant="text" onClick={() => navigate('/dashboards')}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default DashboardCreatePage;
