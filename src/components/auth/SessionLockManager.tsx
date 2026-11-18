import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getIdleLockMinutes,
  isIdleLockPreferenceKey,
  isLockBroadcastKey,
  lockSession,
  readLockInfo,
  SESSION_LOCK_PREFERENCE_EVENT,
  SESSION_LOCK_EVENT,
} from '@/services/sessionLock';
import { tokenService } from '@/services/tokenService';
import { useQueryClient } from '@tanstack/react-query';
import { SessionLockCountdown } from './SessionLockCountdown';

const WARNING_MS = 5_000;
const ZERO_DISPLAY_MS = 180;

/** Global guard for manual lock, cross-tab lock, and inactivity lock. */
export function SessionLockManager() {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lastActivity = useRef(Date.now());
  const activeUser = useRef<string | null>(null);
  const warningActive = useRef(false);
  const zeroTimer = useRef<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const clearZeroTimer = () => {
    if (zeroTimer.current !== null) {
      window.clearTimeout(zeroTimer.current);
      zeroTimer.current = null;
    }
  };

  const keepAlive = () => {
    if (!user || readLockInfo()) return;
    if (!tokenService.getAccessToken()) {
      lockSession('other-tab');
      return;
    }

    const minutes = getIdleLockMinutes(String(user.id));
    const now = Date.now();
    // The deadline cannot be extended once it has already passed.
    if (now >= lastActivity.current + minutes * 60_000) {
      lockSession('idle', true, minutes);
      return;
    }
    clearZeroTimer();
    warningActive.current = false;
    lastActivity.current = now;
    setRemainingMs(null);
  };

  useEffect(() => {
    if (!isLoading && readLockInfo() && location.pathname !== '/locked' &&
        location.pathname !== '/auth') {
      navigate('/locked', { replace: true });
    }
  }, [isLoading, location.pathname, navigate]);

  useEffect(() => {
    function onLock() {
      clearZeroTimer();
      warningActive.current = false;
      setRemainingMs(null);
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
      warningActive.current = false;
      clearZeroTimer();
      setRemainingMs(null);
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
      warningActive.current = false;
      clearZeroTimer();
      setRemainingMs(null);
    }

    const lockForIdle = (minutes: number) => {
      if (readLockInfo() || !tokenService.getAccessToken()) return;
      warningActive.current = false;
      clearZeroTimer();
      setRemainingMs(null);
      lockSession('idle', true, minutes);
    };

    function checkIdle(forceImmediate = false) {
      if (!tokenService.getAccessToken() || readLockInfo()) return;
      const minutes = getIdleLockMinutes(account);
      const deadline = lastActivity.current + minutes * 60_000;
      const remaining = deadline - Date.now();

      if (remaining <= 0) {
        // If the tab was backgrounded, do not give an extra grace period.
        if (forceImmediate || remaining < -ZERO_DISPLAY_MS || !warningActive.current) {
          lockForIdle(minutes);
          return;
        }
        // Display the requested 0 in the circle briefly before locking.
        setRemainingMs(0);
        if (zeroTimer.current === null) {
          zeroTimer.current = window.setTimeout(() => lockForIdle(minutes), ZERO_DISPLAY_MS);
        }
        return;
      }

      if (remaining <= WARNING_MS) {
        warningActive.current = true;
        clearZeroTimer();
        setRemainingMs(remaining);
      } else if (warningActive.current) {
        // A preference changed to a longer interval in another tab.
        warningActive.current = false;
        clearZeroTimer();
        setRemainingMs(null);
      }
    }

    const onActivity = () => {
      // Incidental movement/touch must not cancel an active warning;
      // only pressing Keep Alive explicitly extends the idle window.
      if (warningActive.current) return;
      const now = Date.now();
      const minutes = getIdleLockMinutes(account);
      if (now >= lastActivity.current + minutes * 60_000 - WARNING_MS) {
        checkIdle();
      } else {
        lastActivity.current = now;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkIdle(true);
    };
    const onPreference = () => checkIdle();
    const onStorage = (event: StorageEvent) => {
      if (isIdleLockPreferenceKey(event.key)) checkIdle();
    };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach(name => window.addEventListener(name, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(SESSION_LOCK_PREFERENCE_EVENT, onPreference);
    window.addEventListener('storage', onStorage);

    // Use absolute wall-clock deadlines; browser timers may be throttled.
    const interval = window.setInterval(() => checkIdle(), 80);
    checkIdle();
    return () => {
      events.forEach(name => window.removeEventListener(name, onActivity));
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(SESSION_LOCK_PREFERENCE_EVENT, onPreference);
      window.removeEventListener('storage', onStorage);
      window.clearInterval(interval);
      clearZeroTimer();
    };
  }, [user?.id, isLoading, location.pathname]);

  return (
    <SessionLockCountdown
      open={remainingMs !== null}
      remainingMs={remainingMs ?? WARNING_MS}
      onKeepAlive={keepAlive}
      onLockNow={() => lockSession('manual')}
    />
  );
}
