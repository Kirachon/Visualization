import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import authReducer from '../../../stores/authSlice';

const renderWithStore = (ui: React.ReactNode, preloadedState: any) => {
  const store = configureStore({ reducer: { auth: authReducer }, preloadedState });
  return render(<Provider store={store}>{ui}</Provider>);
};

test('redirects unauthenticated users to /login', () => {
  renderWithStore(
    <MemoryRouter initialEntries={[{ pathname: '/protected' }] as any}>
      <Routes>
        <Route path="/protected" element={<ProtectedRoute>secret</ProtectedRoute>} />
        <Route path="/login" element={<div>login</div>} />
      </Routes>
    </MemoryRouter>,
    { auth: { user: null, isAuthenticated: false, loading: false, error: null } },
  );
  expect(screen.getByText('login')).toBeInTheDocument();
});

test('renders children when authenticated', () => {
  renderWithStore(
    <MemoryRouter initialEntries={[{ pathname: '/protected' }] as any}>
      <Routes>
        <Route path="/protected" element={<ProtectedRoute>secret</ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
    {
      auth: {
        user: {
          id: '1',
          username: 'u',
          email: '',
          firstName: 'A',
          lastName: 'B',
          role: { id: 'r', name: 'Admin' },
          tenantId: 't',
        },
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  );
  expect(screen.getByText('secret')).toBeInTheDocument();
});
