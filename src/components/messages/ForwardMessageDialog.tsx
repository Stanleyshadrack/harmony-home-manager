import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight, Forward, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Conversation, Message } from '@/types/message';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: Message | null;
  conversations: Conversation[];
  onForward: (message: Message, destinationId: number) => Promise<void>;
}

export function ForwardMessageDialog({
  open, onOpenChange, message, conversations, onForward,
}: Props) {
  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setDestination(null);
  }, [open, message?.id]);

  if (!message) return null;
  const available = conversations.filter(c =>
    c.id !== message.conversationId &&
    (c.type === 'DIRECT' || !c.adminsOnlySend || c.currentUserAdmin) &&
    c.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const submit = async () => {
    if (destination == null || submitting) return;
    setSubmitting(true);
    try {
      await onForward(message, destination);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not forward message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => { if (!submitting) onOpenChange(next); }}>
      <DialogContent className="flex h-[min(590px,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] min-h-0 w-[calc(100vw-2rem)] max-w-md flex-col gap-3 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5" /> Forward message
          </DialogTitle>
          <DialogDescription>
            Choose a conversation you belong to. Group posting permissions still apply.
          </DialogDescription>
        </DialogHeader>
        <div className="shrink-0 rounded-lg border bg-muted/40 p-3">
          <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm">
            {message.content || message.attachment?.filename || 'Attachment'}
          </p>
          {message.attachment && <p className="mt-1 truncate text-xs text-muted-foreground">
            Attached: {message.attachment.filename}
          </p>}
        </div>
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={search} className="pl-9" aria-label="Search destination conversations"
            onChange={event => setSearch(event.target.value)}
            placeholder="Search chats and groups…" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-md border">
          <RadioGroup value={destination == null ? '' : String(destination)}
            onValueChange={value => setDestination(Number(value))} className="gap-0">
            {available.map(c => (
              <label key={c.id} className="flex min-h-12 cursor-pointer items-center gap-3 border-b p-3 last:border-0 hover:bg-muted/60">
                <RadioGroupItem value={String(c.id)} id={`forward-destination-${c.id}`} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.title}</span>
                <span className="text-xs text-muted-foreground">{c.type === 'GROUP' ? 'Group' : 'Private'}</span>
              </label>
            ))}
          </RadioGroup>
          {available.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No eligible conversations found. Start another chat first.
            </p>
          )}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t pt-3">
          <Button type="button" variant="outline" disabled={submitting}
            onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={submitting || destination == null}
            onClick={() => void submit()}>
            <ArrowRight className="mr-1 h-4 w-4" /> {submitting ? 'Forwarding…' : 'Forward'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
