import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isLockBroadcastKey, lockSession, readLockInfo, SESSION_IDLE_MINUTES, SESSION_LOCK_EVENT } from '@/services/sessionLock';
import { tokenService } from '@/services/tokenService';
import { useQueryClient } from '@tanstack/react-query';

const IDLE_MS = SESSION_IDLE_MINUTES * 60 * 1000;

/** Global guard for manual lock, cross-tab lock, and inactivity lock. */
export function SessionLockManager() {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!isLoading && readLockInfo() && location.pathname !== '/locked' &&
        location.pathname !== '/auth') {
      navigate('/locked', { replace: true });
    }
  }, [isLoading, location.pathname, navigate]);

  useEffect(() => {
    function onLock() {
      logout();
      queryClient.clear();
      navigate('/locked', { replace: true });
    }
    function onOtherTab(event: StorageEvent) {
      if (!isLockBroadcastKey(event.key) || !event.newValue) return;
      // The other tab already removed shared localStorage tokens.
      lockSession('other-tab', false);
    }
    window.addEventListener(SESSION_LOCK_EVENT, onLock);
    window.addEventListener('storage', onOtherTab);
    return () => {
      window.removeEventListener(SESSION_LOCK_EVENT, onLock);
      window.removeEventListener('storage', onOtherTab);
    };
  }, [logout, navigate, queryClient]);

  useEffect(() => {
    if (!user || isLoading || location.pathname === '/auth' || location.pathname === '/locked')
      return;
    if (!tokenService.getAccessToken()) {
      lockSession('other-tab');
      return;
    }
    lastActivity.current = Date.now();
    const activity = () => { lastActivity.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach(name => window.addEventListener(name, activity, { passive: true }));
    const interval = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= IDLE_MS) lockSession('idle');
    }, 15_000);
    return () => {
      events.forEach(name => window.removeEventListener(name, activity));
      window.clearInterval(interval);
    };
  }, [user?.id, isLoading, location.pathname]);

  return null;
}
