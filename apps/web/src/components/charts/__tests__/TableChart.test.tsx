import React from 'react';
import { render, screen } from '@testing-library/react';
import TableChart from '../TableChart';

describe('TableChart', () => {
  it('renders empty state', () => {
    render(<TableChart data={[]} title="T" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });

  it('renders pagination controls', () => {
    const rows = Array.from({ length: 25 }).map((_, i) => ({ a: i }));
    render(<TableChart data={rows} title="T" />);
    expect(screen.getByText(/Rows per page/i)).toBeInTheDocument();
  });
});
