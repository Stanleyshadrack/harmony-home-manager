import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PhoneIncoming, Video } from 'lucide-react';
import { callApi, type ChatCall } from '@/api/service/callApi';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

/** In-app ring indicator for authenticated users outside the Messages page. */
export function IncomingCallBanner() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<ChatCall | null>(null);
  useEffect(() => {
    if (!user?.id || location.pathname === '/messages') {
      setIncoming(null);
      return;
    }
    let mounted = true;
    const load = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const calls = await callApi.incoming();
        if (mounted) setIncoming(calls.find(call => call.recipientId === Number(user.id)) ?? null);
      } catch { if (mounted) setIncoming(null); }
    };
    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [user?.id, location.pathname]);
  if (!incoming) return null;
  return <div role="alert" className="sticky top-14 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-primary/30 bg-primary/10 px-4 py-2 text-sm">
    <div className="flex items-center gap-2">
      {incoming.video ? <Video className="h-4 w-4" /> : <PhoneIncoming className="h-4 w-4" />}
      <span>Incoming {incoming.video ? 'video' : 'voice'} call</span>
    </div>
    <Button type="button" size="sm" onClick={() =>
      navigate(`/messages?conversation=${incoming.conversationId}`)}>
      Open Messages to answer
    </Button>
  </div>;
}
