import reducer, { fetchUsers, createUser, updateUser, deleteUser, type UsersState } from '../userSlice';

const initial: UsersState = { items: [], total: 0, loading: false, error: null };

describe('userSlice', () => {
  it('handles fetchUsers.fulfilled', () => {
    const next = reducer(initial, { type: fetchUsers.fulfilled.type, payload: { items: [{ id: '1' } as any], total: 1 } });
    expect(next.items).toHaveLength(1);
    expect(next.total).toBe(1);
  });

  it('handles createUser.fulfilled', () => {
    const next = reducer(initial, { type: createUser.fulfilled.type, payload: { id: '1' } });
    expect(next.items[0].id).toBe('1');
  });

  it('handles updateUser.fulfilled', () => {
    const state = { ...initial, items: [{ id: '1', username: 'a' } as any] };
    const next = reducer(state, { type: updateUser.fulfilled.type, payload: { id: '1', username: 'b' } });
    expect(next.items[0].username).toBe('b');
  });

  it('handles deleteUser.fulfilled', () => {
    const state = { ...initial, items: [{ id: '1' } as any], total: 1 };
    const next = reducer(state, { type: deleteUser.fulfilled.type, payload: '1' });
    expect(next.items).toHaveLength(0);
    expect(next.total).toBe(0);
  });
});

