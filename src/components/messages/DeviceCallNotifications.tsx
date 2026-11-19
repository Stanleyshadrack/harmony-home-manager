import { useEffect, useRef, useState } from 'react';
import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { callApi } from '@/api/service/callApi';
import { useAuth } from '@/contexts/AuthContext';

function notify(title: string, body: string, conversationId: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, { body, tag: `propmanager-call-${conversationId}` });
    notification.onclick = () => {
      window.focus();
      window.location.assign(`/messages?conversation=${conversationId}`);
    };
  } catch { /* Browser may prohibit system notifications even when allowed. */ }
}

/** Foreground browser/desktop alerts. Closed-browser push requires a separate push subscription service. */
export function DeviceCallNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [secure, setSecure] = useState(false);
  const observed = useRef<Set<string> | null>(null);

  useEffect(() => {
    setPermission('Notification' in window ? Notification.permission : 'unsupported');
    setSecure(window.isSecureContext);
  }, []);

  useEffect(() => {
    if (!user?.id) { observed.current = null; return; }
    let active = true;
    observed.current = null;
    const poll = async () => {
      // Continue polling while this tab is open, including when it is backgrounded.
      // Timers may be throttled; true closed-browser push needs a service worker.
      try {
        const [incoming, history] = await Promise.all([callApi.incoming(), callApi.history()]);
        if (!active) return;
        const recentMissed = history.filter(call => call.recipientId === Number(user.id)
          && call.status === 'MISSED' && Date.now() - new Date(call.endedAt || call.startedAt).getTime() < 5 * 60_000);
        const ids = new Set([
          ...incoming.map(call => `incoming:${call.callId}`),
          ...recentMissed.map(call => `missed:${call.callId}`),
        ]);
        if (observed.current !== null) {
          incoming.forEach(call => {
            if (!observed.current?.has(`incoming:${call.callId}`))
              notify(call.video ? 'Incoming video call' : 'Incoming voice call',
                'Open PropManager Messages to answer.', call.conversationId);
          });
          recentMissed.forEach(call => {
            if (!observed.current?.has(`missed:${call.callId}`))
              notify(call.video ? 'Missed video call' : 'Missed voice call',
                'Open PropManager Messages to see call history.', call.conversationId);
          });
        }
        observed.current = ids;
      } catch { /* best-effort foreground notifications */ }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user?.id]);

  const enable = async () => {
    if (!('Notification' in window) || !window.isSecureContext) return;
    const status = await Notification.requestPermission();
    setPermission(status);
  };
  if (!user || permission !== 'default' || !secure) return null;
  return <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => void enable()}
    title="Enable device notifications for calls while PropManager is open">
    <BellRing className="h-4 w-4" /><span className="hidden sm:inline">Enable call alerts</span>
  </Button>;
}
