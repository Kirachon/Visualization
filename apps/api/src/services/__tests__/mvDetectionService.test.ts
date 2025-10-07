import { suggestFromRecentWorkload, recordSuggested } from '../mvDetectionService.js';
import { perfService } from '../perfService.js';

describe('mvDetectionService', () => {
  test('suggestFromRecentWorkload returns empty when disabled', async () => {
    const old = process.env.MV_AUTO_DETECT_ENABLE;
    process.env.MV_AUTO_DETECT_ENABLE = 'false';
    const res = await suggestFromRecentWorkload('tenant-test');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    process.env.MV_AUTO_DETECT_ENABLE = old;
  });

  test('recordSuggested increments metric', async () => {
    const before = perfService.mvStats();
    await recordSuggested(2);
    const after = perfService.mvStats();
    expect(after.suggested - before.suggested).toBe(2);
  });
});

