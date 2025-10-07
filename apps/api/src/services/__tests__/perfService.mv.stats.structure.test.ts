import { perfService } from '../../services/perfService.js';

describe('perfService mvStats structure', ()=>{
  it('includes byEngine breakdown', ()=>{
    const stats = perfService.mvStats() as any;
    expect(stats).toHaveProperty('suggested');
    expect(stats).toHaveProperty('byEngine');
    expect(stats.byEngine).toHaveProperty('olap');
    expect(stats.byEngine).toHaveProperty('oltp');
  });
});

