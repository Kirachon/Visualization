import authReducer, { loginStart, loginSuccess, loginFailure, logout } from '../authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: {
      id: 'role-1',
      name: 'Admin',
    },
    tenantId: 'tenant-1',
  };

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle loginStart', () => {
    const actual = authReducer(initialState, loginStart());
    expect(actual.loading).toBe(true);
    expect(actual.error).toBe(null);
  });

  it('should handle loginSuccess', () => {
    const actual = authReducer(initialState, loginSuccess(mockUser));
    expect(actual.user).toEqual(mockUser);
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.loading).toBe(false);
    expect(actual.error).toBe(null);
  });

  it('should handle loginFailure', () => {
    const errorMessage = 'Invalid credentials';
    const actual = authReducer(initialState, loginFailure(errorMessage));
    expect(actual.error).toBe(errorMessage);
    expect(actual.loading).toBe(false);
    expect(actual.isAuthenticated).toBe(false);
    expect(actual.user).toBe(null);
  });

  it('should handle logout', () => {
    const authenticatedState = {
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    const actual = authReducer(authenticatedState, logout());
    expect(actual).toEqual(initialState);
  });
});
