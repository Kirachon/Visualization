import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { ChartStyleContext } from './ChartStyleContext';

export interface PieChartProps {
  data: any[];
  width?: number;
  height?: number;
  categoryKey?: string;
  valueKey?: string;
  title?: string;
  ariaLabel?: string;
  colors?: string[];
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 300,
  height = 240,
  categoryKey,
  valueKey,
  title,
  ariaLabel,
  colors,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const theme = useTheme();
  const styleCtx = useContext(ChartStyleContext);

  const [cField, vField] = useMemo(() => {
    if (categoryKey && valueKey) return [categoryKey, valueKey];
    if (!data?.length) return ['name', 'value'];
    const keys = Object.keys(data[0] || {});
    return [keys[0] || 'name', keys[1] || 'value'];
  }, [data, categoryKey, valueKey]);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const radius = Math.min(width, height) / 2;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('aria-label', ariaLabel || styleCtx.ariaLabel || title || 'Pie chart')
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie<any>()
      .value((d) => Number(d[vField]))
      .sort(null);

    const arc = d3.arc<any>().innerRadius(0).outerRadius(radius);

    const palette = (colors && colors.length ? colors : (styleCtx.palette.length ? styleCtx.palette : [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      '#8884d8',
      '#82ca9d',
      '#ffc658',
    ]));
    const color = d3
      .scaleOrdinal<string>()
      .domain(data.map((d) => String(d[cField])))
      .range(palette);

    const arcs = g.selectAll('arc').data(pie(data)).enter().append('g').attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d: any) => color(String(d.data[cField])) as string)
      .append('title')
      .text((d: any) => `${d.data[cField]}: ${d.data[vField]}`);
  }, [data, cField, vField, width, height, theme, title]);

  return <svg data-testid="chart-svg" ref={ref} width="100%" height={height} />;
};

export default PieChart;
