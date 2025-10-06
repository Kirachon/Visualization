import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryEditor } from '../QueryEditor';

jest.mock('../../../services/dataSourceService', () => ({
  __esModule: true,
  default: {
    executeQuery: jest.fn().mockResolvedValue({
      rows: [ { id: 1 } ], rowCount: 1, executionTime: 12,
      metadata: { engine: 'olap', cacheHit: true }
    }),
  },
}));

describe('QueryEditor badges and cancel', () => {
  it('shows engine/cache badges and cancel during execution', async () => {
    render(<QueryEditor dataSourceId="ds1" />);

    const btn = screen.getByRole('button', { name: /Execute Query/i });
    fireEvent.click(btn);

    // Cancel should appear while executing
    await waitFor(() => expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument());

    // Wait for result render
    await waitFor(() => expect(screen.getByText(/rows returned/i)).toBeInTheDocument());

    expect(screen.getByText(/Engine: OLAP/)).toBeInTheDocument();
    expect(screen.getByText(/Cache: HIT/)).toBeInTheDocument();
  });
});

