import React from 'react';

export interface ChartStyle {
  themeName: 'light' | 'dark' | 'high-contrast';
  palette: string[];
  ariaLabel?: string;
  grid?: boolean;
}

export const ChartStyleContext = React.createContext<ChartStyle>({
  themeName: 'light',
  palette: [],
  ariaLabel: undefined,
  grid: false,
});

export default ChartStyleContext;

