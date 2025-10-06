import reducer, { setGlobalFilters, addGlobalFilter, clearGlobalFilters } from '../filtersSlice';

describe('filtersSlice', () => {
  it('sets, adds, and clears global filters', () => {
    let state = reducer(undefined, { type: 'init' } as any);
    state = reducer(state, setGlobalFilters([{ key: 'status', op: 'eq', value: 'active' }]));
    expect(state.globals).toHaveLength(1);
    state = reducer(state, addGlobalFilter({ key: 'country', op: 'eq', value: 'US' }));
    expect(state.globals).toHaveLength(2);
    state = reducer(state, clearGlobalFilters());
    expect(state.globals).toHaveLength(0);
  });
});

