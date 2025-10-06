import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import filtersReducer from '../../../stores/filtersSlice';
import GlobalFiltersBar from '../GlobalFiltersBar';

describe('GlobalFiltersBar', () => {
  it('adds and clears filters', () => {
    const store = configureStore({ reducer: { filters: filtersReducer } });
    render(
      <Provider store={store}>
        <GlobalFiltersBar />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText('Field'), { target: { value: 'country' } });
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'US' } });
    fireEvent.click(screen.getByText('Add filter'));

    expect(screen.getByText('country=US')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear'));
    expect(screen.queryByText('country=US')).toBeNull();
  });
});

