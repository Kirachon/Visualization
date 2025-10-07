import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { ChartStyleContext } from './ChartStyleContext';

export interface DonutChartProps {
  data: any[];
  width?: number;
  height?: number;
  labelKey?: string;
  valueKey?: string;
  title?: string;
  ariaLabel?: string;
  colors?: string[];
  innerRadius?: number; // As percentage of outer radius (0-1)
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  width = 300,
  height = 300,
  labelKey,
  valueKey,
  title,
  ariaLabel,
  colors,
  innerRadius = 0.5,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const theme = useTheme();
  const styleCtx = useContext(ChartStyleContext);

  const [labelField, valueField] = useMemo(() => {
    if (labelKey && valueKey) return [labelKey, valueKey];
    if (!data?.length) return ['label', 'value'];
    const keys = Object.keys(data[0] || {});
    return [keys[0] || 'label', keys[1] || 'value'];
  }, [data, labelKey, valueKey]);

  useEffect(() => {
    if (!ref.current || !data?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const radius = Math.min(width, height) / 2 - 20;
    const innerR = radius * innerRadius;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('aria-label', ariaLabel || title || 'Donut chart')
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

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
      .domain(data.map((d) => d[labelField]))
      .range(colors || defaultColors);

    // Pie generator
    const pie = d3
      .pie<any>()
      .value((d) => +d[valueField])
      .sort(null);

    // Arc generator
    const arc = d3.arc<any>().innerRadius(innerR).outerRadius(radius);

    const arcHover = d3.arc<any>().innerRadius(innerR).outerRadius(radius + 5);

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

    // Draw arcs
    const arcs = g
      .selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => colorScale(d.data[labelField]))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('d', arcHover);

        const total = d3.sum(data, (item) => +item[valueField]);
        const percent = ((+d.data[valueField] / total) * 100).toFixed(1);

        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.data[labelField]}</strong><br/>${d.data[valueField]} (${percent}%)`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('d', arc);
        tooltip.style('opacity', 0);
      });

    // Center text (total)
    const total = d3.sum(data, (d) => +d[valueField]);
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .attr('fill', theme.palette.text.primary)
      .text(total.toLocaleString());

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '12px')
      .attr('fill', theme.palette.text.secondary)
      .text('Total');

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, labelField, valueField, theme, styleCtx, colors, innerRadius, ariaLabel, title]);

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

export default DonutChart;

