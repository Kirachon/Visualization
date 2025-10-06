import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartContainer from '../ChartContainer';
import dataSourceService from '../../../services/dataSourceService';

jest.mock('../../../services/dataSourceService');

(test || it)('ChartContainer fetches and renders children with data', async () => {
  (dataSourceService as any).executeQuery.mockResolvedValue({
    rows: [{ x: 'A', y: 1 }],
    rowCount: 1,
    executionTime: 1,
  });
  render(
    <ChartContainer bindings={{ dataSourceId: 'ds1', query: 'select 1' }}>
      {({ data }) => <div>rows:{data.length}</div>}
    </ChartContainer>,
  );
  expect(await screen.findByText(/rows:1/)).toBeInTheDocument();
});
