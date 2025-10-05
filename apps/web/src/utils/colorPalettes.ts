export const categorical = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

export const sequential = [
  '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6',
  '#4292c6', '#2171b5', '#08519c', '#08306b'
];

export const diverging = [
  '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7',
  '#d1e5f0', '#92c5de', '#4393c3', '#2166ac'
];

export function getPalette(name: string = 'categorical'): string[] {
  switch (name) {
    case 'sequential':
      return sequential;
    case 'diverging':
      return diverging;
    default:
      return categorical;
  }
}

