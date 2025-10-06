import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../stores/store';
import { loginSuccess } from '../../stores/authSlice';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardEditPage from '../DashboardEditPage';
import * as dashboardService from '../../services/dashboardService';

jest.mock('../../services/dashboardService');

const def = {
  id: 'd1',
  meta: {
    id: 'd1',
    tenantId: 't1',
    name: 'Dash',
    description: '',
    tags: [],
    ownerId: 'u1',
    createdAt: '',
    updatedAt: '',
  },
  layout: [],
  components: [],
};

describe('DashboardEditPage integration', () => {
  beforeEach(() => {
    (dashboardService as any).default.getById = jest.fn().mockResolvedValue(def);
    (dashboardService as any).default.patch = jest.fn().mockResolvedValue(def);
  });

  it('loads, adds a component, and autosaves', async () => {
    // Set authenticated user matching owner
    store.dispatch(
      loginSuccess({
        id: 'u1',
        username: 'u1',
        email: 'u1@x.com',
        firstName: 'U',
        lastName: 'One',
        role: { id: 'r', name: 'admin' },
        tenantId: 't1',
      }) as any,
    );

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{ pathname: '/dashboards/d1/edit' } as any]}>
          <Routes>
            <Route path="/dashboards/:id/edit" element={<DashboardEditPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(await screen.findByText('Dash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add Component/i }));

    await waitFor(() => expect((dashboardService as any).default.patch).toHaveBeenCalled());

    expect(screen.getAllByRole('button', { name: /Remove component/i }).length).toBeGreaterThan(0);
  });
});
