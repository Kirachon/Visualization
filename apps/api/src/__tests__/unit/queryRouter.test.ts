import { chooseEngine } from '../../services/queryRouter.js';

describe('queryRouter.chooseEngine', () => {
  it('defaults to oltp for simple selects', () => {
    expect(chooseEngine('select 1')).toBe('oltp');
    expect(chooseEngine(' SELECT * FROM users ')).toBe('oltp');
  });

  it('routes to olap for analytical patterns (GROUP BY, WINDOW)', () => {
    expect(chooseEngine('select a, count(*) from t group by a')).toBe('olap');
    expect(chooseEngine('select sum(x) over (partition by a) from t')).toBe('olap');
  });

  it('honors SQL hint /*+ engine=olap */', () => {
    expect(chooseEngine('/*+ engine=olap */ select * from t')).toBe('olap');
  });

  it('honors preferOlap flag', () => {
    expect(chooseEngine('select 1', true)).toBe('olap');
  });
});

