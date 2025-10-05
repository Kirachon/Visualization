import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../stores/authSlice';

interface Props {
  idleTimeMs?: number; // default 30 minutes
}

const SessionTimeout: React.FC<Props> = ({ idleTimeMs = 30 * 60 * 1000 }) => {
  const dispatch = useDispatch();
  const timer = useRef<number | null>(null);

  const reset = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      dispatch(logout());
      // Hard redirect to login to clear any state
      window.location.href = '/login';
    }, idleTimeMs);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      events.forEach((ev) => window.removeEventListener(ev, reset as any));
    };
  }, [idleTimeMs]);

  return null;
};

export default SessionTimeout;

