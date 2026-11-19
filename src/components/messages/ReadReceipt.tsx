import { Check, CheckCheck } from 'lucide-react';
import type { ChatMember, Message } from '@/types/message';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ReadReceiptProps {
  message: Message;
  members: ChatMember[];
  isGroup: boolean;
}

/**
 * Read receipts are based on the server's per-member lastReadAt timestamp.
 * "Sent" never claims delivery, which we do not track separately.
 */
export function ReadReceipt({ message, members, isGroup }: ReadReceiptProps) {
  const eligibleReaders = members.filter(member =>
    member.userId !== message.senderId &&
    new Date(member.joinedAt).getTime() <= new Date(message.createdAt).getTime()
  );
  const readerIds = new Set(message.readBy || []);
  const read = eligibleReaders.filter(member => readerIds.has(member.userId));
  const unread = eligibleReaders.filter(member => !readerIds.has(member.userId));
  const allRead = eligibleReaders.length > 0 && read.length === eligibleReaders.length;

  const label = eligibleReaders.length === 0
    ? 'Sent'
    : isGroup
      ? allRead ? 'Read by all' : `Read by ${read.length} of ${eligibleReaders.length}`
      : read.length > 0 ? 'Read' : 'Sent';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label + '. View read details'}
          title={label}
          className="inline-flex min-h-7 items-center gap-1 rounded px-1 text-[11px] hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {read.length > 0
            ? <CheckCheck className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          <span>{isGroup && eligibleReaders.length > 0
            ? `${read.length}/${eligibleReaders.length}`
            : read.length > 0 ? 'Read' : 'Sent'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-60 p-3 text-sm">
        <p className="mb-2 font-semibold">Message status</p>
        {read.length > 0 ? (
          <>
            <p className="mb-1 text-xs text-muted-foreground">Read by</p>
            <ul className="max-h-32 space-y-1 overflow-auto">
              {read.map(member => <li key={member.userId} className="truncate">{member.name}</li>)}
            </ul>
          </>
        ) : <p className="text-xs text-muted-foreground">Not read by other participants yet.</p>}
        {isGroup && unread.length > 0 && (
          <>
            <p className="mb-1 mt-3 text-xs text-muted-foreground">Not yet read</p>
            <ul className="max-h-32 space-y-1 overflow-auto">
              {unread.map(member => <li key={member.userId} className="truncate">{member.name}</li>)}
            </ul>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
