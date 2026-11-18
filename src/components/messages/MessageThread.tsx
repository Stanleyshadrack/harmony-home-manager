import { useEffect, useRef } from 'react';
import type { Message } from '@/types/message';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MessageThreadProps {
  messages: Message[];
  isLoading?: boolean;
  onDelete?: (message: Message) => Promise<void>;
  canDeleteOthers?: boolean;
  totalParticipants?: number;
}

export function MessageThread({
  messages,
  isLoading,
  onDelete,
  canDeleteOthers = false,
  totalParticipants = 2,
}: MessageThreadProps) {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  if (isLoading && !messages.length) {
    return <div role="status" className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Loading messages…
    </div>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-4 sm:px-5">
      <div className="mx-auto max-w-3xl space-y-3">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to get started.
          </p>
        )}
        {messages.map(message => {
          const own = message.senderId === Number(user?.id);
          const canDelete = !message.deleted && !!onDelete && (own || canDeleteOthers);
          return (
            <div key={message.id} className={cn('flex', own ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'group relative max-w-[88%] rounded-xl px-3 py-2 shadow-sm sm:max-w-[75%]',
                own ? 'bg-primary text-primary-foreground' : 'border bg-background'
              )}>
                {!own && <p className="mb-1 text-xs font-semibold text-primary">{message.senderName}</p>}
                <p className={cn('whitespace-pre-wrap break-words text-sm', message.deleted && 'italic opacity-75')}>
                  {message.content}
                </p>
                <div className={cn('mt-1 flex items-center justify-end gap-2 text-[11px]', own ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  {canDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete message for everyone"
                      aria-label="Delete message for everyone"
                      className="h-6 w-6 opacity-70 hover:opacity-100"
                      onClick={() => { if (window.confirm('Delete this message for everyone?')) void onDelete?.(message); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
                  {own && (
                    message.readBy.length >= Math.max(1, totalParticipants - 1)
                      ? <CheckCheck className="h-3.5 w-3.5" aria-label="Read by all" />
                      : message.readBy.length > 0
                        ? <CheckCheck className="h-3.5 w-3.5" aria-label="Read by some" />
                        : <Check className="h-3.5 w-3.5" aria-label="Sent" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  );
}
