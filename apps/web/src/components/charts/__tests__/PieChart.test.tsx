import React from 'react';
import { render, screen } from '@testing-library/react';
import PieChart from '../PieChart';

test('PieChart renders accessible svg', () => {
  render(
    <PieChart
      data={[
        { name: 'A', value: 2 },
        { name: 'B', value: 3 },
      ]}
      title="Pie"
    />,
  );
  expect(screen.getByRole('img', { name: /Pie/i })).toBeInTheDocument();
});
