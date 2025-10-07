import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AreaChart from '../AreaChart';

describe('AreaChart', () => {
  const mockData = [
    { month: 'Jan', value: 30 },
    { month: 'Feb', value: 45 },
    { month: 'Mar', value: 60 },
    { month: 'Apr', value: 55 },
    { month: 'May', value: 70 },
  ];

  it('renders without crashing with valid data', () => {
    render(<AreaChart data={mockData} xKey="month" yKey="value" />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays "No data" message when data is empty', () => {
    render(<AreaChart data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('applies custom width and height', () => {
    render(<AreaChart data={mockData} width={500} height={300} xKey="month" yKey="value" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 500 300');
  });

  it('uses provided aria-label', () => {
    render(<AreaChart data={mockData} ariaLabel="Sales area chart" xKey="month" yKey="value" />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Sales area chart');
  });

  it('renders with custom fill opacity', () => {
    render(<AreaChart data={mockData} fillOpacity={0.3} xKey="month" yKey="value" />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // D3 creates the path with fill-opacity attribute
    const path = svg?.querySelector('path[fill-opacity]');
    expect(path).toBeInTheDocument();
  });

  it('infers keys from data when not provided', () => {
    render(<AreaChart data={mockData} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

