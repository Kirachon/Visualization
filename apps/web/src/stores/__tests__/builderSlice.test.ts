import reducer, {
  setInitial,
  addComponent,
  updateComponent,
  removeComponent,
  undoAction,
  redoAction,
  markSaved,
} from '../builderSlice';
import type { DashboardDefinition } from '../../types/dashboard';

describe('builderSlice', () => {
  const base: DashboardDefinition = {
    id: 'd1',
    meta: {
      id: 'd1',
      tenantId: 't1',
      name: 'Dash',
      tags: [],
      ownerId: 'u1',
      createdAt: '',
      updatedAt: '',
    },
    layout: [],
    components: [],
  };

  it('initializes and adds component', () => {
    let state = reducer(undefined, { type: '@@init' } as any);
    state = reducer(state, setInitial(base));
    state = reducer(
      state,
      addComponent({ type: 'bar', layout: { i: 'c1', x: 0, y: 0, w: 4, h: 4 } }),
    );
    expect(state.history?.present.components).toHaveLength(1);
    expect(state.history?.present.layout).toHaveLength(1);
    expect(state.selectedId).toBe('c1');
  });

  it('updates component and supports undo/redo', () => {
    let state = reducer(undefined, { type: '@@init' } as any);
    state = reducer(state, setInitial(base));
    state = reducer(
      state,
      addComponent({ type: 'bar', layout: { i: 'c1', x: 0, y: 0, w: 4, h: 4 } }),
    );
    state = reducer(state, updateComponent({ id: 'c1', patch: { title: 'New' } }));
    expect(state.history?.present.components[0].title).toBe('New');
    const s2 = reducer(state, undoAction());
    const s3 = reducer(s2, redoAction());
    expect(s3.history?.present.components[0].title).toBe('New');
  });

  it('removes component and marks saved', () => {
    let state = reducer(undefined, { type: '@@init' } as any);
    state = reducer(state, setInitial(base));
    state = reducer(
      state,
      addComponent({ type: 'bar', layout: { i: 'c1', x: 0, y: 0, w: 4, h: 4 } }),
    );
    state = reducer(state, removeComponent('c1'));
    expect(state.history?.present.components).toHaveLength(0);
    expect(state.history?.present.layout).toHaveLength(0);
    state = reducer(state, markSaved());
    expect(state.dirty).toBe(false);
  });
});
