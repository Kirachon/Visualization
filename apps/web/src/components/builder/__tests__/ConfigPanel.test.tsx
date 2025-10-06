import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfigPanel from '../ConfigPanel';

const base = {
  id: 'c1',
  type: 'bar' as const,
  title: '',
  description: '',
  bindings: { dataSourceId: '', query: '' },
  options: {},
};

test('ConfigPanel shows validation when binding missing', () => {
  const onChange = jest.fn();
  render(<ConfigPanel component={base} onChange={onChange} />);
  const queryInput = screen.getByLabelText('SQL Query');
  expect(queryInput).toHaveAttribute('aria-invalid', 'true');
  fireEvent.change(screen.getByLabelText('Data Source ID'), { target: { value: 'ds1' } });
  fireEvent.change(queryInput, { target: { value: 'select 1' } });
  // After change, would call onChange — consumer applies state; here we just verify onChange was called twice
  expect(onChange).toHaveBeenCalledTimes(2);
});
