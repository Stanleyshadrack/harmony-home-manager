import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getIdleLockMinutes, isIdleLockPreferenceKey, isLockBroadcastKey, lockSession, readLockInfo, SESSION_LOCK_PREFERENCE_EVENT, SESSION_LOCK_EVENT } from '@/services/sessionLock';
import { tokenService } from '@/services/tokenService';
import { useQueryClient } from '@tanstack/react-query';


/** Global guard for manual lock, cross-tab lock, and inactivity lock. */
export function SessionLockManager() {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lastActivity = useRef(Date.now());
  const activeUser = useRef<string | null>(null);

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
    if (!user || isLoading || location.pathname === '/auth' || location.pathname === '/locked') {
      activeUser.current = null;
      return;
    }
    if (!tokenService.getAccessToken()) {
      lockSession('other-tab');
      return;
    }

    const account = String(user.id);
    // Route changes must not restart an existing idle window.
    if (activeUser.current !== account) {
      lastActivity.current = Date.now();
      activeUser.current = account;
    }

    function checkIdle() {
      if (!tokenService.getAccessToken() || readLockInfo()) return;
      const minutes = getIdleLockMinutes(account);
      if (Date.now() - lastActivity.current >= minutes * 60_000) {
        lockSession('idle', true, minutes);
      }
    }

    const onActivity = () => { lastActivity.current = Date.now(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') checkIdle(); };
    const onPreference = () => { checkIdle(); };
    const onStorage = (event: StorageEvent) => {
      if (isIdleLockPreferenceKey(event.key)) checkIdle();
    };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach(name => window.addEventListener(name, onActivity, {passive: true}));
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(SESSION_LOCK_PREFERENCE_EVENT, onPreference);
    window.addEventListener('storage', onStorage);
    const interval = window.setInterval(checkIdle, 1000);
    checkIdle();
    return () => {
      events.forEach(name => window.removeEventListener(name, onActivity));
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(SESSION_LOCK_PREFERENCE_EVENT, onPreference);
      window.removeEventListener('storage', onStorage);
      window.clearInterval(interval);
    };
  }, [user?.id, isLoading, location.pathname]);

  return null;
}
