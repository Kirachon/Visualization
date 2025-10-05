import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChartContainer } from '../';

jest.mock('../../../services/dataSourceService', () => ({
  __esModule: true,
  default: {
    executeQuery: jest.fn().mockResolvedValue({ rows: [{ x: 'A', y: 1 }], rowCount: 1, executionTime: 1 }),
  },
}));

describe('ChartContainer themes & palettes', () => {
  test('applies data-theme and data-palette attributes', async () => {
    render(
      <ChartContainer
        bindings={{ dataSourceId: 'ds1', query: 'select 1' } as any}
        config={{ title: 'T' }}
        themeName="dark"
        paletteName="diverging"
      >
        {({ data }) => <div>{data.length}</div>}
      </ChartContainer>
    );

    await waitFor(() => expect(screen.getByRole('figure')).toBeInTheDocument());
    const fig = screen.getByRole('figure');
    expect(fig).toHaveAttribute('data-theme', 'dark');
    expect(fig).toHaveAttribute('data-palette', 'diverging');
  });
});

