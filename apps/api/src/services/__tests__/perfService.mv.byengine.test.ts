import { perfService } from '../../services/perfService.js';

describe('perfService MV counters by engine', () => {
  it('tracks refresh and rewrite by engine', () => {
    (perfService as any).mvRefreshByEngine('olap','success');
    (perfService as any).mvRefreshByEngine('oltp','failed');
    (perfService as any).mvRewriteByEngine('olap', true);
    (perfService as any).mvRewriteByEngine('oltp', false);
    const stats = perfService.mvStats() as any;
    expect(stats.byEngine.olap.refreshSuccess).toBeGreaterThanOrEqual(1);
    expect(stats.byEngine.oltp.refreshFailed).toBeGreaterThanOrEqual(1);
    expect(stats.byEngine.olap.rewriteUsed).toBeGreaterThanOrEqual(1);
    expect(stats.byEngine.oltp.rewriteBypassed).toBeGreaterThanOrEqual(1);
  });
});

