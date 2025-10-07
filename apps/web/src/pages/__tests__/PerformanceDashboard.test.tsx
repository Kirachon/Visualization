import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme';
import PerformanceDashboard from '../PerformanceDashboard';

jest.mock('../../services/perfService', () => ({
  fetchCacheStats: jest.fn(async () => ({ hitRate: 0.5, items: 10, size: 2048 })),
  fetchEngineSplit: jest.fn(async () => ({ sinceMs: 3600000, counts: { oltp: 3, olap: 7 }, total: 10, pctOlap: 0.7 })),
  fetchSlowQueries: jest.fn(async () => ([{ sqlHash: 'abc', durationMs: 1200, at: Date.now() }])),
}));

describe('PerformanceDashboard', () => {
  it('renders cache and engine metrics and slow queries', async () => {
    render(
      <ThemeProvider theme={theme}>
        <PerformanceDashboard />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText(/Performance Dashboard/)).toBeInTheDocument());
    expect(screen.getByText(/Cache/)).toBeInTheDocument();
    expect(screen.getByText(/Engine Split/)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /slow-queries/i })).toBeInTheDocument();
  });
});

