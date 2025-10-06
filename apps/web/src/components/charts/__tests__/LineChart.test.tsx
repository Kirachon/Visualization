import React from 'react';
import { render, screen } from '@testing-library/react';
import LineChart from '../LineChart';

test('LineChart renders accessible svg', () => {
  render(
    <LineChart
      data={[
        { x: 'A', y: 1 },
        { x: 'B', y: 2 },
      ]}
      title="Line"
    />,
  );
  expect(screen.getByRole('img', { name: /Line/i })).toBeInTheDocument();
});
