import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { ChartStyleContext } from './ChartStyleContext';

export interface StackedBarChartProps {
  data: any[];
  width?: number;
  height?: number;
  xKey?: string; // Category key
  seriesKeys?: string[]; // Keys for stacked values
  title?: string;
  ariaLabel?: string;
  colors?: string[];
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  width = 400,
  height = 240,
  xKey,
  seriesKeys,
  title,
  ariaLabel,
  colors,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const theme = useTheme();
  const styleCtx = useContext(ChartStyleContext);

  const [categoryKey, stackKeys] = useMemo(() => {
    if (xKey && seriesKeys) return [xKey, seriesKeys];
    if (!data?.length) return ['category', []];
    const keys = Object.keys(data[0] || {});
    return [keys[0] || 'category', keys.slice(1)];
  }, [data, xKey, seriesKeys]);

  useEffect(() => {
    if (!ref.current || !data?.length || !stackKeys.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 40, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('aria-label', ariaLabel || title || 'Stacked bar chart')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Stack data
    const stack = d3.stack<any>().keys(stackKeys);
    const series = stack(data);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d[categoryKey]))
      .range([0, innerW])
      .padding(0.2);

    const maxY = d3.max(series, (s) => d3.max(s, (d) => d[1])) || 0;
    const yScale = d3.scaleLinear().domain([0, maxY * 1.1]).range([innerH, 0]);

    // Color scale
    const defaultColors = styleCtx?.colors || [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ];
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(stackKeys)
      .range(colors || defaultColors);

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

    // Draw stacked bars
    g.selectAll('g.series')
      .data(series)
      .enter()
      .append('g')
      .attr('class', 'series')
      .attr('fill', (d) => colorScale(d.key))
      .selectAll('rect')
      .data((d) => d)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.data[categoryKey]) || 0)
      .attr('y', (d) => yScale(d[1]))
      .attr('height', (d) => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d: any) {
        const seriesKey = d3.select(this.parentNode as Element).datum() as any;
        const value = d[1] - d[0];

        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${d.data[categoryKey]}</strong><br/>${seriesKey.key}: ${value.toFixed(2)}`,
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');

        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function () {
        tooltip.style('opacity', 0);
        d3.select(this).attr('opacity', 1);
      });

    // Axes
    const xAxis = d3.axisBottom(xScale);
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

    // Legend
    const legend = g
      .append('g')
      .attr('transform', `translate(${innerW + 10}, 0)`)
      .attr('font-size', '11px');

    stackKeys.forEach((key, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

      legendRow
        .append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colorScale(key));

      legendRow
        .append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('fill', theme.palette.text.secondary)
        .text(key);
    });

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, categoryKey, stackKeys, theme, styleCtx, colors, ariaLabel, title]);

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

export default StackedBarChart;

