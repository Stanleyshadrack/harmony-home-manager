import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '@/api/service/chatApi';

export interface TypingUser {
  userId: number;
  name: string;
}

const POLL_MS = 1800;
const HEARTBEAT_MS = 2500;
const STOP_AFTER_MS = 2600;

/**
 * Typing only reveals ephemeral presence (not draft text). POST requests are
 * throttled; the server expires abandoned presence after seven seconds.
 */
export function useTypingPresence(conversationId: number | null, canType: boolean) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const lastHeartbeat = useRef(0);
  const active = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStopTimer = () => {
    if (stopTimer.current !== null) {
      clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
  };

  const updateTyping = useCallback((typing: boolean) => {
    if (conversationId === null) return;

    if (!typing || !canType || document.visibilityState !== 'visible') {
      clearStopTimer();
      if (active.current) {
        active.current = false;
        lastHeartbeat.current = 0;
        void chatApi.setTyping(conversationId, false).catch(() => {
          // The server's seven-second expiry also clears abandoned presence.
        });
      }
      return;
    }

    const now = Date.now();
    if (!active.current || now - lastHeartbeat.current >= HEARTBEAT_MS) {
      active.current = true;
      lastHeartbeat.current = now;
      void chatApi.setTyping(conversationId, true).catch(() => {
        // A server rejection will not leave a permanently visible indicator.
      });
    }

    clearStopTimer();
    stopTimer.current = setTimeout(() => updateTyping(false), STOP_AFTER_MS);
  }, [conversationId, canType]);

  useEffect(() => {
    setTypingUsers([]);
    active.current = false;
    lastHeartbeat.current = 0;
    if (conversationId === null) return;

    let disposed = false;
    let inFlight = false;

    const poll = async () => {
      if (inFlight || document.visibilityState !== 'visible') return;
      inFlight = true;
      try {
        const users = await chatApi.typing(conversationId);
        if (!disposed) setTypingUsers(users);
      } catch {
        if (!disposed) setTypingUsers([]);
      } finally {
        inFlight = false;
      }
    };

    const visibility = () => {
      if (document.visibilityState !== 'visible') {
        setTypingUsers([]);
        updateTyping(false);
      } else {
        void poll();
      }
    };

    void poll();
    const interval = setInterval(() => { void poll(); }, POLL_MS);
    document.addEventListener('visibilitychange', visibility);

    return () => {
      disposed = true;
      clearInterval(interval);
      clearStopTimer();
      document.removeEventListener('visibilitychange', visibility);
      // Capture the old conversation ID, not the new selection.
      if (active.current) {
        active.current = false;
        void chatApi.setTyping(conversationId, false).catch(() => {});
      }
    };
  }, [conversationId, updateTyping]);

  return { typingUsers, updateTyping };
}
