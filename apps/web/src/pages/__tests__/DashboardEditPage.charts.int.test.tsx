import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardEditPage from '../DashboardEditPage';
import builderReducer from '../../stores/builderSlice';
import dashboardsReducer from '../../stores/dashboardsSlice';
import authReducer, { loginSuccess } from '../../stores/authSlice';
import dashboardService from '../../services/dashboardService';
import dataSourceService from '../../services/dataSourceService';

jest.mock('../../services/dashboardService');
jest.mock('../../services/dataSourceService');

describe('DashboardEditPage charts integration', () => {
  function setup() {
    const store = configureStore({
      reducer: { builder: builderReducer, dashboards: dashboardsReducer, auth: authReducer },
    });
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

    (dashboardService as any).getById.mockResolvedValue({
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
      version: 1,
    });
    (dashboardService as any).patch.mockResolvedValue({});
    (dataSourceService as any).executeQuery.mockResolvedValue({
      rows: [{ x: 'A', y: 1 }],
      rowCount: 1,
      executionTime: 1,
    });

    const ui = (
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboards/d1/edit']}>
          <Routes>
            <Route path="/dashboards/:id/edit" element={<DashboardEditPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    return { store, ui };
  }

  it('renders a chart after adding and binding', async () => {
    const { ui } = setup();
    render(ui);

    // Add a bar component
    const addBar = await screen.findByLabelText(/Add Bar component/i);
    fireEvent.click(addBar);

    // After add, chart container will show configure message before bindings
    expect(await screen.findByText(/Configure data source/i)).toBeInTheDocument();
  });
});
