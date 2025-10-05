import { categorical, sequential, diverging, getPalette } from '../colorPalettes';

describe('colorPalettes', () => {
  test('getPalette returns arrays with expected lengths', () => {
    expect(Array.isArray(categorical)).toBe(true);
    expect(categorical.length).toBeGreaterThanOrEqual(5);
    expect(sequential.length).toBeGreaterThanOrEqual(5);
    expect(diverging.length).toBeGreaterThanOrEqual(5);
  });

  test('getPalette picks by name with fallback', () => {
    expect(getPalette('categorical')).toBe(categorical);
    expect(getPalette('sequential')).toBe(sequential);
    expect(getPalette('diverging')).toBe(diverging);
    expect(getPalette('unknown')).toBe(categorical);
  });
});

