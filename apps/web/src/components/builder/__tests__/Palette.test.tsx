import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Palette from '../Palette';

test('Palette adds component on click and keyboard', () => {
  const onAdd = jest.fn();
  render(<Palette onAdd={onAdd} />);
  const barBtn = screen.getByLabelText(/Add Bar component/i);
  fireEvent.click(barBtn);
  expect(onAdd).toHaveBeenCalledWith('bar');
  const lineBtn = screen.getByLabelText(/Add Line component/i);
  act(() => { lineBtn.focus(); });
  act(() => { fireEvent.keyDown(lineBtn, { key: 'Enter' }); });
  expect(onAdd).toHaveBeenCalledWith('line');
});
