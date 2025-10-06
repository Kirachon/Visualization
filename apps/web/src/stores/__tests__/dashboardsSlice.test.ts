import reducer, { setQuery, setPage } from '../dashboardsSlice';
import type { DashboardsState } from '../dashboardsSlice';

describe('dashboardsSlice', () => {
  const initial: DashboardsState = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
    q: '',
    loading: false,
    error: null,
    byId: {},
  };

  it('updates query and page', () => {
    let state = reducer(initial, setQuery('sales'));
    expect(state.q).toBe('sales');
    state = reducer(state, setPage(3));
    expect(state.page).toBe(3);
  });
});
