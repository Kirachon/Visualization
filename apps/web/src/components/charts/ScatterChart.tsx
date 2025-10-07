import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { ChartStyleContext } from './ChartStyleContext';

export interface ScatterChartProps {
  data: any[];
  width?: number;
  height?: number;
  xKey?: string;
  yKey?: string;
  sizeKey?: string; // Optional: for bubble chart effect
  title?: string;
  ariaLabel?: string;
  colors?: string[];
  pointRadius?: number;
}

const ScatterChart: React.FC<ScatterChartProps> = ({
  data,
  width = 400,
  height = 240,
  xKey,
  yKey,
  sizeKey,
  title,
  ariaLabel,
  colors,
  pointRadius = 4,
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
    if (!ref.current || !data?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('aria-label', ariaLabel || title || 'Scatter chart')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xExtent = d3.extent(data, (d) => +d[xField]) as [number, number];
    const yExtent = d3.extent(data, (d) => +d[yField]) as [number, number];

    const xScale = d3
      .scaleLinear()
      .domain([xExtent[0] * 0.9, xExtent[1] * 1.1])
      .range([0, innerW]);

    const yScale = d3
      .scaleLinear()
      .domain([yExtent[0] * 0.9, yExtent[1] * 1.1])
      .range([innerH, 0]);

    // Size scale (if sizeKey provided)
    let sizeScale: d3.ScaleLinear<number, number> | null = null;
    if (sizeKey) {
      const sizeExtent = d3.extent(data, (d) => +d[sizeKey]) as [number, number];
      sizeScale = d3.scaleLinear().domain(sizeExtent).range([2, 12]);
    }

    // Color
    const fillColor =
      colors?.[0] || styleCtx?.colors?.[0] || theme.palette.primary.main || '#1976d2';

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', '#fff')
      .style('padding', '6px 10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 9999);

    // Draw points
    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(+d[xField]))
      .attr('cy', (d) => yScale(+d[yField]))
      .attr('r', (d) => (sizeScale && sizeKey ? sizeScale(+d[sizeKey]) : pointRadius))
      .attr('fill', fillColor)
      .attr('fill-opacity', 0.7)
      .attr('stroke', fillColor)
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill-opacity', 1).attr('stroke-width', 2);

        let tooltipText = `<strong>${xField}: ${d[xField]}</strong><br/>${yField}: ${d[yField]}`;
        if (sizeKey) {
          tooltipText += `<br/>${sizeKey}: ${d[sizeKey]}`;
        }

        tooltip
          .style('opacity', 1)
          .html(tooltipText)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill-opacity', 0.7).attr('stroke-width', 1);
        tooltip.style('opacity', 0);
      });

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(8);
    const yAxis = d3.axisLeft(yScale).ticks(6);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', theme.palette.text.secondary)
      .style('font-size', '11px');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', theme.palette.text.secondary)
      .style('font-size', '11px');

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-innerW).tickFormat(() => ''));

    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(8).tickSize(-innerH).tickFormat(() => ''));

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.text.secondary)
      .style('font-size', '12px')
      .text(xField);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.text.secondary)
      .style('font-size', '12px')
      .text(yField);

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, xField, yField, sizeKey, theme, styleCtx, colors, pointRadius, ariaLabel, title]);

  if (!data?.length) {
    return (
      <svg width={width} height={height}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#999">
          No data
        </text>
      </svg>
    );
  }

  return <svg ref={ref} style={{ maxWidth: '100%', height: 'auto' }} />;
};

export default ScatterChart;

