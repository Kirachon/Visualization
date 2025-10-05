import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChartContainer } from '../';
import BarChart from '../BarChart';

jest.mock('../../../services/dataSourceService', () => ({
  __esModule: true,
  default: {
    executeQuery: jest.fn().mockResolvedValue({ rows: [ { category: 'A', value: 3 } ], rowCount: 1, executionTime: 1 }),
  },
}));

describe('Chart ariaLabel precedence', () => {
  test('BarChart ariaLabel prop overrides context/config ariaLabel', async () => {
    render(
      <ChartContainer
        bindings={{ dataSourceId: 'ds1', query: 'select 1' } as any}
        config={{ title: 'T', ariaLabel: 'From Context' }}
      >
        {({ data }) => <BarChart data={data} xKey="category" yKey="value" ariaLabel="From Prop" />}
      </ChartContainer>
    );

    await waitFor(() => expect(screen.getByRole('figure')).toBeInTheDocument());
    const svg = screen.getByTestId('chart-svg');
    expect(svg.getAttribute('aria-label')).toBe('From Prop');
  });
});

