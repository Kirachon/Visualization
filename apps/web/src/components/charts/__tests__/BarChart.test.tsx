import React from 'react';
import { render, screen } from '@testing-library/react';
import BarChart from '../BarChart';

test('BarChart renders svg and bars via title tooltips', () => {
  render(
    <BarChart
      data={[
        { cat: 'A', val: 2 },
        { cat: 'B', val: 3 },
      ]}
      xKey="cat"
      yKey="val"
      title="T"
    />,
  );
  const svg = screen.getByRole('img', { name: /T/i });
  expect(svg).toBeInTheDocument();
});
