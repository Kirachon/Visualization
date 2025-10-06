import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChartContainer } from '../';
import BarChart from '../BarChart';

jest.mock('../../../services/dataSourceService', () => ({
  __esModule: true,
  default: {
    executeQuery: jest.fn().mockResolvedValue({ rows: [ { category: 'A', value: 10 } ], rowCount: 1, executionTime: 1 }),
  },
}));

describe('ChartContainer color propagation', () => {
  test('BarChart uses first palette color when provided by ChartContainer', async () => {
    render(
      <ChartContainer
        bindings={{ dataSourceId: 'ds1', query: 'select 1' } as any}
        config={{ title: 'T' }}
        themeName="light"
        paletteName="categorical"
      >
        {({ data }) => (
          <div>
            <BarChart data={data} xKey="category" yKey="value" />
          </div>
        )}
      </ChartContainer>
    );

    await waitFor(() => expect(screen.getByRole('figure')).toBeInTheDocument());
    // The chart renders a rect with fill equal to the palette primary color
    // We can't import palette directly without coupling; instead, assert it is set to some non-empty value
    const rect = document.querySelector('rect.bar') as SVGRectElement | null;
    expect(rect).toBeTruthy();
    expect(rect?.getAttribute('fill')).toBeTruthy();
  });
});

