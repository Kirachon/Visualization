import { useEffect, useRef } from 'react';

export function useLiveData(enabled: boolean, onTick: () => void, intervalMs = 1000) {
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    // @ts-ignore
    timer.current = window.setInterval(() => {
      onTick();
    }, intervalMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
  }, [enabled, intervalMs, onTick]);
}

