import type { ChartTheme } from '../types/charts';

export const lightTheme: ChartTheme = {
  name: 'light',
  background: '#ffffff',
  textColor: '#222222',
  gridColor: '#e0e0e0',
  seriesColors: ['#1976d2', '#9c27b0', '#2e7d32', '#ff9800', '#d32f2f'],
};

export const darkTheme: ChartTheme = {
  name: 'dark',
  background: '#121212',
  textColor: '#eeeeee',
  gridColor: '#333333',
  seriesColors: ['#90caf9', '#ce93d8', '#a5d6a7', '#ffcc80', '#ef9a9a'],
};

export const highContrastTheme: ChartTheme = {
  name: 'high-contrast',
  background: '#000000',
  textColor: '#ffffff',
  gridColor: '#777777',
  seriesColors: ['#ffff00', '#00ffff', '#ff00ff', '#ffffff', '#ffa500'],
};

export function getChartTheme(name: 'light' | 'dark' | 'high-contrast' = 'light'): ChartTheme {
  switch (name) {
    case 'dark':
      return darkTheme;
    case 'high-contrast':
      return highContrastTheme;
    default:
      return lightTheme;
  }
}

