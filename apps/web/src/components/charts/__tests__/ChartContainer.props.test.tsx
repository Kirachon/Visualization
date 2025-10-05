import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChartContainer } from '../';

jest.mock('../../../services/dataSourceService', () => ({
  __esModule: true,
  default: {
    executeQuery: jest.fn().mockResolvedValue({ rows: [{ x: 'A', y: 1 }], rowCount: 1, executionTime: 1 }),
  },
}));

describe('ChartContainer props', () => {
  test('applies aria-label from config and renders children after data load', async () => {
    render(
      <ChartContainer
        bindings={{ dataSourceId: 'ds1', query: 'select 1 as y, \"A\" as x' } as any}
        config={{ title: 'Sales', ariaLabel: 'Sales Chart' }}
      >
        {({ data }) => <div data-testid="child">{data.length}</div>}
      </ChartContainer>
    );

    await waitFor(() => expect(screen.getByRole('figure')).toBeInTheDocument());
    const fig = screen.getByRole('figure');
    expect(fig).toHaveAttribute('aria-label', 'Sales Chart');
    expect(await screen.findByTestId('child')).toHaveTextContent('1');
  });
});

