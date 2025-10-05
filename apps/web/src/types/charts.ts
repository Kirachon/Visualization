export type ChartType = 'bar' | 'line' | 'pie';

export interface SeriesPoint {
  x: number | string | Date;
  y: number;
}

export interface Series {
  id: string;
  name?: string;
  data: SeriesPoint[];
}

export interface AxesConfig {
  xLabel?: string;
  yLabel?: string;
}

export interface ChartConfig {
  title?: string;
  legend?: boolean;
  axes?: AxesConfig;
  grid?: boolean;
  ariaLabel?: string;
}

export interface Interactions {
  hover?: boolean;
  select?: boolean;
  onPointClick?: (p: any) => void;
}

export interface PerformanceOptions {
  rendering?: 'svg' | 'canvas' | 'auto';
}

export interface ChartTheme {
  name: 'light' | 'dark' | 'high-contrast';
  background: string;
  textColor: string;
  gridColor: string;
  seriesColors: string[];
}

