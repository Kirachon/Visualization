import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DonutChart from '../DonutChart';
import ScatterChart from '../ScatterChart';
import StackedBarChart from '../StackedBarChart';
import Histogram from '../Histogram';

describe('DonutChart', () => {
  const mockData = [
    { category: 'A', value: 30 },
    { category: 'B', value: 45 },
    { category: 'C', value: 25 },
  ];

  it('renders without crashing with valid data', () => {
    render(<DonutChart data={mockData} labelKey="category" valueKey="value" />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays "No data" message when data is empty', () => {
    render(<DonutChart data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('uses provided aria-label', () => {
    render(<DonutChart data={mockData} ariaLabel="Category donut chart" />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Category donut chart');
  });
});

describe('ScatterChart', () => {
  const mockData = [
    { x: 10, y: 20 },
    { x: 20, y: 35 },
    { x: 30, y: 25 },
    { x: 40, y: 45 },
  ];

  it('renders without crashing with valid data', () => {
    render(<ScatterChart data={mockData} xKey="x" yKey="y" />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays "No data" message when data is empty', () => {
    render(<ScatterChart data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('uses provided aria-label', () => {
    render(<ScatterChart data={mockData} ariaLabel="XY scatter plot" />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'XY scatter plot');
  });

  it('renders with size key for bubble effect', () => {
    const bubbleData = [
      { x: 10, y: 20, size: 5 },
      { x: 20, y: 35, size: 10 },
    ];
    render(<ScatterChart data={bubbleData} xKey="x" yKey="y" sizeKey="size" />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('StackedBarChart', () => {
  const mockData = [
    { category: 'Q1', sales: 100, costs: 60 },
    { category: 'Q2', sales: 120, costs: 70 },
    { category: 'Q3', sales: 140, costs: 80 },
  ];

  it('renders without crashing with valid data', () => {
    render(<StackedBarChart data={mockData} xKey="category" seriesKeys={['sales', 'costs']} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays "No data" message when data is empty', () => {
    render(<StackedBarChart data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('uses provided aria-label', () => {
    render(
      <StackedBarChart
        data={mockData}
        ariaLabel="Quarterly stacked bar chart"
        seriesKeys={['sales', 'costs']}
      />,
    );
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Quarterly stacked bar chart');
  });

  it('infers series keys from data when not provided', () => {
    render(<StackedBarChart data={mockData} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('Histogram', () => {
  const mockData = Array.from({ length: 100 }, (_, i) => ({ value: Math.random() * 100 }));

  it('renders without crashing with valid data', () => {
    render(<Histogram data={mockData} valueKey="value" />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays "No data" message when data is empty', () => {
    render(<Histogram data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('uses provided aria-label', () => {
    render(<Histogram data={mockData} ariaLabel="Value distribution histogram" />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Value distribution histogram');
  });

  it('uses custom number of bins', () => {
    render(<Histogram data={mockData} valueKey="value" bins={20} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

