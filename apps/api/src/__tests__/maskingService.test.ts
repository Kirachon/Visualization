import { maskingService } from '../services/maskingService.js';

describe('MaskingService.applyMask', () => {
  test('full masking replaces value with ***', () => {
    const out = maskingService.applyMask('secret123', { strategy: 'full' });
    expect(out).toBe('***');
  });

  test('partial masking keeps configured prefix/suffix', () => {
    const out = maskingService.applyMask('abcdef123456', { strategy: 'partial', rule: { visible_prefix: 2, visible_suffix: 3, mask_char: '#' } });
    expect(out).toBe('ab#######456');
  });

  test('hash masking returns hex digest', () => {
    const out = maskingService.applyMask('pii@example.com', { strategy: 'hash', rule: { algorithm: 'sha256' } });
    expect(typeof out).toBe('string');
    expect(out).toMatch(/^[a-f0-9]{64}$/);
  });

  test('handles null/undefined without change', () => {
    expect(maskingService.applyMask(null as any, { strategy: 'full' })).toBeNull();
    expect(maskingService.applyMask(undefined as any, { strategy: 'partial' })).toBeUndefined();
  });
});

