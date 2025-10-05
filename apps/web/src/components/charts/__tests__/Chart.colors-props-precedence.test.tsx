import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChartContainer } from '../';
import BarChart from '../BarChart';

jest.mock('../../../services/dataSourceService', () => ({
  __esModule: true,
  default: {
    executeQuery: jest.fn().mockResolvedValue({ rows: [ { category: 'A', value: 7 } ], rowCount: 1, executionTime: 1 }),
  },
}));

describe('Chart colors precedence', () => {
  test('BarChart colors prop overrides context palette', async () => {
    render(
      <ChartContainer
        bindings={{ dataSourceId: 'ds1', query: 'select 1' } as any}
        config={{ title: 'T' }}
        themeName="dark"
        paletteName="categorical"
      >
        {({ data }) => <BarChart data={data} xKey="category" yKey="value" colors={[ '#123456', '#abcdef' ]} />}
      </ChartContainer>
    );

    await waitFor(() => expect(screen.getByRole('figure')).toBeInTheDocument());
    const rect = document.querySelector('rect.bar') as SVGRectElement | null;
    expect(rect).toBeTruthy();
    expect(rect?.getAttribute('fill')).toBe('#123456');
  });
});

