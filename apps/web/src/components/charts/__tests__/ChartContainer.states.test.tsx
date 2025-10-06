import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartContainer from '../ChartContainer';
import dataSourceService from '../../../services/dataSourceService';

jest.mock('../../../services/dataSourceService');

describe('ChartContainer states', () => {
  it('renders configure message when bindings missing', async () => {
    render(<ChartContainer>{() => <div>child</div>}</ChartContainer>);
    expect(await screen.findByText(/Configure data source/i)).toBeInTheDocument();
  });

  it('renders error state on fetch failure', async () => {
    (dataSourceService as any).executeQuery.mockRejectedValueOnce(new Error('nope'));
    render(
      <ChartContainer bindings={{ dataSourceId: 'ds1', query: 'select 1' }}>
        {() => <div>child</div>}
      </ChartContainer>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/Failed to fetch data/i);
  });
});
