import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { ChartStyleContext } from './ChartStyleContext';

export interface LineChartProps {
  data: any[];
  width?: number;
  height?: number;
  xKey?: string;
  yKey?: string;
  title?: string;
  ariaLabel?: string;
  colors?: string[];
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 400,
  height = 240,
  xKey,
  yKey,
  title,
  ariaLabel,
  colors,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const theme = useTheme();
  const styleCtx = useContext(ChartStyleContext);

  const [xField, yField] = useMemo(() => {
    if (xKey && yKey) return [xKey, yKey];
    if (!data?.length) return ['x', 'y'];
    const keys = Object.keys(data[0] || {});
    return [keys[0] || 'x', keys[1] || 'y'];
  }, [data, xKey, yKey]);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('aria-label', ariaLabel || styleCtx.ariaLabel || title || 'Line chart')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scalePoint()
      .domain(data.map((d) => String(d[xField])))
      .range([0, innerW]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d: any) => Number(d[yField])) || 0])
      .nice()
      .range([innerH, 0]);

    const color = (colors && colors[0]) || styleCtx.palette[0] || theme.palette.primary.main;

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '10px');

    // Y axis
    g.append('g').call(d3.axisLeft(y)).selectAll('text').style('font-size', '10px');

    // Optional horizontal gridlines
    if (styleCtx.grid) {
      g.append('g')
        .attr('class', 'grid')
        .call(
          d3
            .axisLeft(y)
            .tickSize(-innerW)
            .tickFormat(() => '') as any,
        )
        .selectAll('line')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-opacity', 0.7);
    }

    const line = d3
      .line<any>()
      .x((d) => x(String(d[xField])) || 0)
      .y((d) => y(Number(d[yField])));

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line as any);

    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d: any) => x(String(d[xField])) || 0)
      .attr('cy', (d: any) => y(Number(d[yField])))
      .attr('r', 3)
      .attr('fill', color)
      .append('title')
      .text((d: any) => `${d[xField]}: ${d[yField]}`);
  }, [data, width, height, xField, yField, theme, title]);

  return <svg data-testid="chart-svg" ref={ref} width="100%" height={height} />;
};

export default LineChart;
