import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { ChartStyleContext } from './ChartStyleContext';

export interface AreaChartProps {
  data: any[];
  width?: number;
  height?: number;
  xKey?: string;
  yKey?: string;
  title?: string;
  ariaLabel?: string;
  colors?: string[];
  fillOpacity?: number;
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  width = 400,
  height = 240,
  xKey,
  yKey,
  title,
  ariaLabel,
  colors,
  fillOpacity = 0.6,
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
      .attr('aria-label', ariaLabel || title || 'Area chart')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, innerW]);

    const yExtent = d3.extent(data, (d) => +d[yField]) as [number, number];
    const yScale = d3
      .scaleLinear()
      .domain([0, yExtent[1] * 1.1])
      .range([innerH, 0]);

    // Area generator
    const area = d3
      .area<any>()
      .x((_d, i) => xScale(i))
      .y0(innerH)
      .y1((d) => yScale(+d[yField]))
      .curve(d3.curveMonotoneX);

    // Line generator (for stroke)
    const line = d3
      .line<any>()
      .x((_d, i) => xScale(i))
      .y((d) => yScale(+d[yField]))
      .curve(d3.curveMonotoneX);

    // Color
    const fillColor =
      colors?.[0] || styleCtx?.colors?.[0] || theme.palette.primary.main || '#1976d2';

    // Draw area
    g.append('path')
      .datum(data)
      .attr('fill', fillColor)
      .attr('fill-opacity', fillOpacity)
      .attr('d', area);

    // Draw line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', fillColor)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(data.length, 10))
      .tickFormat((d) => data[+d]?.[xField] || '');

    const yAxis = d3.axisLeft(yScale).ticks(5);

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
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat(() => ''));

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

    // Overlay for hover
    g.append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event, this);
        const idx = Math.round(xScale.invert(mx));
        if (idx >= 0 && idx < data.length) {
          const d = data[idx];
          tooltip
            .style('opacity', 1)
            .html(`<strong>${d[xField]}</strong><br/>${yField}: ${d[yField]}`)
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px');
        }
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, xField, yField, theme, styleCtx, colors, fillOpacity, ariaLabel, title]);

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

export default AreaChart;

