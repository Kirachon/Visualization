import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useLiveData } from '../useLiveData';

jest.useFakeTimers();

describe('useLiveData', () => {
  it('invokes onTick on interval when enabled', () => {
    const onTick = jest.fn();
    renderHook(() => useLiveData(true, onTick, 200));
    expect(onTick).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(600); });
    expect(onTick).toHaveBeenCalledTimes(3);
  });
});

