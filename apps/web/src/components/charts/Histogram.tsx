import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { ChartStyleContext } from './ChartStyleContext';

export interface HistogramProps {
  data: any[];
  width?: number;
  height?: number;
  valueKey?: string;
  bins?: number; // Number of bins
  title?: string;
  ariaLabel?: string;
  colors?: string[];
}

const Histogram: React.FC<HistogramProps> = ({
  data,
  width = 400,
  height = 240,
  valueKey,
  bins = 10,
  title,
  ariaLabel,
  colors,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const theme = useTheme();
  const styleCtx = useContext(ChartStyleContext);

  const valueField = useMemo(() => {
    if (valueKey) return valueKey;
    if (!data?.length) return 'value';
    const keys = Object.keys(data[0] || {});
    return keys[0] || 'value';
  }, [data, valueKey]);

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
      .attr('aria-label', ariaLabel || title || 'Histogram')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Extract values
    const values = data.map((d) => +d[valueField]);

    // Create histogram bins
    const xExtent = d3.extent(values) as [number, number];
    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);

    const histogram = d3
      .bin<number, number>()
      .domain(xScale.domain() as [number, number])
      .thresholds(xScale.ticks(bins));

    const binData = histogram(values);

    // Y scale
    const yMax = d3.max(binData, (d) => d.length) || 0;
    const yScale = d3.scaleLinear().domain([0, yMax * 1.1]).range([innerH, 0]);

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

    // Draw bars
    g.selectAll('rect')
      .data(binData)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.x0 || 0) + 1)
      .attr('y', (d) => yScale(d.length))
      .attr('width', (d) => Math.max(0, xScale(d.x1 || 0) - xScale(d.x0 || 0) - 2))
      .attr('height', (d) => innerH - yScale(d.length))
      .attr('fill', fillColor)
      .attr('fill-opacity', 0.7)
      .attr('stroke', fillColor)
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill-opacity', 1);

        const range = `${d.x0?.toFixed(2)} - ${d.x1?.toFixed(2)}`;
        tooltip
          .style('opacity', 1)
          .html(`<strong>Range: ${range}</strong><br/>Count: ${d.length}`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill-opacity', 0.7);
        tooltip.style('opacity', 0);
      });

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(8);
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

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.text.secondary)
      .style('font-size', '12px')
      .text(valueField);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.text.secondary)
      .style('font-size', '12px')
      .text('Frequency');

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, valueField, bins, theme, styleCtx, colors, ariaLabel, title]);

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

export default Histogram;

