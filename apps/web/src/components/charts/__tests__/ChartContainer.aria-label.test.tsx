import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChartContainer } from '../';
import PieChart from '../PieChart';

jest.mock('../../../services/dataSourceService', () => ({
  __esModule: true,
  default: {
    executeQuery: jest.fn().mockResolvedValue({ rows: [ { name: 'A', value: 5 } ], rowCount: 1, executionTime: 1 }),
  },
}));

describe('ChartContainer aria-label propagation', () => {
  test('inner chart svg uses aria-label from ChartContainer config', async () => {
    render(
      <ChartContainer
        bindings={{ dataSourceId: 'ds1', query: 'select 1' } as any}
        config={{ title: 'Revenue', ariaLabel: 'Revenue by Segment' }}
      >
        {({ data }) => <PieChart data={data} categoryKey="name" valueKey="value" />}
      </ChartContainer>
    );

    await waitFor(() => expect(screen.getByRole('figure')).toBeInTheDocument());
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-label')).toBe('Revenue by Segment');
  });
});

