import { useEffect, useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { callApi, type CallHistoryEntry } from '@/api/service/callApi';
import type { Conversation } from '@/types/message';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  conversations: Conversation[];
  onOpenConversation: (conversation: Conversation) => void;
}
export function CallHistoryPanel({ conversations, onOpenConversation }: Props) {
  const { user } = useAuth();
  const [history, setHistory] = useState<CallHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true);
    try {
      const records = await callApi.history();
      setHistory(records);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load call history'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [user?.id]);

  const contactName = (record: CallHistoryEntry) => {
    const conversation = conversations.find(c => c.id === record.conversationId);
    if (!conversation) return 'Conversation unavailable';
    const personId = record.callerId === Number(user?.id) ? record.recipientId : record.callerId;
    return conversation.members.find(member => member.userId === personId)?.name || conversation.title;
  };
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-lg font-semibold">Call History</h2>
        <p className="text-xs text-muted-foreground">Your recent voice and video calls</p>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
        <RefreshCw className="mr-2 h-4 w-4" />Refresh
      </Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {loading && !history.length && <p className="text-sm text-muted-foreground">Loading calls…</p>}
    {!loading && !history.length && !error && <p className="rounded-lg border p-4 text-sm text-muted-foreground">No calls yet.</p>}
    <div className="space-y-2">
      {history.map(item => {
        const outgoing = item.callerId === Number(user?.id);
        const missed = item.status === 'MISSED';
        const conversation = conversations.find(c => c.id === item.conversationId);
        const duration = item.answeredAt && item.endedAt
          ? Math.max(0, Math.floor((new Date(item.endedAt).getTime() - new Date(item.answeredAt).getTime()) / 1000))
          : null;
        const status = missed ? 'Missed'
          : item.status === 'DECLINED' ? 'Declined'
          : item.status === 'CANCELLED' ? 'Cancelled'
          : item.status === 'ENDED' ? 'Completed'
          : item.status === 'ACCEPTED' ? 'In progress' : 'Ringing';
        const Icon = missed ? PhoneMissed : outgoing ? PhoneOutgoing : PhoneIncoming;
        return <div key={item.callId} className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border p-3">
          <div className="rounded-full bg-muted p-2">
            <Icon className={`h-4 w-4 ${missed ? 'text-destructive' : 'text-primary'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words font-medium">{contactName(item)}</p>
            <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {item.video ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
              {outgoing ? 'Outgoing' : 'Incoming'} · {status}
              {duration !== null ? ` · ${Math.floor(duration / 60)}m ${duration % 60}s` : ''}
            </p>
            <p className="text-xs text-muted-foreground">{new Date(item.startedAt).toLocaleString()}</p>
          </div>
          {conversation && <Button size="sm" variant="outline" onClick={() => onOpenConversation(conversation)}>
            Open chat
          </Button>}
        </div>;
      })}
    </div>
  </div>;
}
