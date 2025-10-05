import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

function Boom() {
  throw new Error('boom');
}

test('ErrorBoundary renders fallback on error', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong in the builder');
  } finally {
    spy.mockRestore();
  }
});
