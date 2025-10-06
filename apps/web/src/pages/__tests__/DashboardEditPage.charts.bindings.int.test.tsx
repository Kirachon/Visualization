import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardEditPage from '../DashboardEditPage';
import builderReducer, { selectComponent, updateComponent } from '../../stores/builderSlice';
import dashboardsReducer from '../../stores/dashboardsSlice';
import authReducer, { loginSuccess } from '../../stores/authSlice';
import dashboardService from '../../services/dashboardService';
import dataSourceService from '../../services/dataSourceService';

jest.mock('../../services/dashboardService');
jest.mock('../../services/dataSourceService');

describe('DashboardEditPage charts with bindings', () => {
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

  it('renders chart after bindings are set', async () => {
    const { store, ui } = setup();
    render(ui);

    const addBar = await screen.findByLabelText(/Add Bar component/i);
    fireEvent.click(addBar);

    // Select the just-added component and update its bindings directly in the store
    const state = store.getState() as any;
    const compId = state.builder.history.present.components[0].id;
    store.dispatch(selectComponent(compId));
    store.dispatch(
      updateComponent({
        id: compId,
        patch: { bindings: { dataSourceId: 'ds1', query: 'select 1' } },
      }),
    );

    // Chart should render an accessible svg (bar/line/pie), or table will render its structure
    expect(await screen.findByRole('img')).toBeInTheDocument();
  });
});
