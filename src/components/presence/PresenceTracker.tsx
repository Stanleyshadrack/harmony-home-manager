import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/api/https';
import { readLockInfo, SESSION_LOCK_EVENT } from '@/services/sessionLock';
import { tokenService } from '@/services/tokenService';

const PULSE_MS = 15_000;
const SESSION_KEY = 'apartment:presence-session';

function getSessionId() {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value || !/^[0-9a-f-]{36}$/i.test(value)) {
    // Presence session IDs are not credentials. Unlike encrypted chat keys,
    // they must also work on the app's current non-HTTPS LAN test address.
    value = globalThis.crypto?.randomUUID?.() ??
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
        const n = Math.floor(Math.random() * 16);
        return (char === 'x' ? n : (n & 3) | 8).toString(16);
      });
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

/**
 * One heartbeat per visible authenticated tab. The server expires sessions
 * after 45 seconds if the tab disappears without sending an offline update.
 */
export function PresenceTracker() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let active = true;
    const sessionId = getSessionId();
    let inFlight = false;

    const eligible = () =>
      active && document.visibilityState === 'visible' &&
      !readLockInfo() && !!tokenService.getAccessToken();

    const send = async (path: 'heartbeat' | 'offline') => {
      if (path === 'heartbeat' && (!eligible() || inFlight)) return;
      if (!tokenService.getAccessToken()) return;
      if (path === 'heartbeat') inFlight = true;
      try {
        await apiRequest<{ sessionId: string }, void>({
          path: `/api/presence/${path}`, method: 'POST',
          body: { sessionId }, timeout: 7000,
        });
      } catch {
        // Offline status is automatically repaired by the server's 45s expiry.
      } finally {
        if (path === 'heartbeat') inFlight = false;
      }
    };

    const visibilityChanged = () => {
      if (eligible()) void send('heartbeat');
      else void send('offline');
    };
    const locked = () => {
      // The lock handler clears browser tokens immediately; backend presence
      // expires shortly afterward if the explicit offline call cannot run.
      void send('offline');
    };
    void send('heartbeat');
    const interval = window.setInterval(() => { void send('heartbeat'); }, PULSE_MS);
    document.addEventListener('visibilitychange', visibilityChanged);
    window.addEventListener(SESSION_LOCK_EVENT, locked);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', visibilityChanged);
      window.removeEventListener(SESSION_LOCK_EVENT, locked);
      void send('offline');
    };
  }, [user?.id, isAuthenticated]);

  return null;
}
