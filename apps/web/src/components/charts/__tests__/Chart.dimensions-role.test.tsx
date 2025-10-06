import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChartContainer } from '../';
import BarChart from '../BarChart';

jest.mock('../../../services/dataSourceService', () => ({
  __esModule: true,
  default: {
    executeQuery: jest.fn().mockResolvedValue({ rows: [ { x: 'A', y: 10 } ], rowCount: 1, executionTime: 1 }),
  },
}));

describe('Chart dimensions and role', () => {
  test('BarChart respects width/height and sets role="img"', async () => {
    render(
      <ChartContainer
        bindings={{ dataSourceId: 'ds1', query: 'select 1' } as any}
        config={{ title: 'T', ariaLabel: 'Accessible Chart' }}
      >
        {({ data }) => <BarChart data={data} xKey="x" yKey="y" width={500} height={300} />}
      </ChartContainer>
    );

    await waitFor(() => expect(screen.getByRole('figure')).toBeInTheDocument());
    const svg = screen.getByTestId('chart-svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 500 300');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Accessible Chart');
  });
});

