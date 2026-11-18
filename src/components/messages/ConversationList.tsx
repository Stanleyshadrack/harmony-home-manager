import type { Conversation } from '@/types/message';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { UsersRound } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: number | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <ScrollArea className="h-full max-h-full">
      <div className="space-y-1 p-2">
        {conversations.map(conversation => {
          const group = conversation.type === 'GROUP';
          const initials = conversation.title.split(' ').slice(0, 2).map(t => t.charAt(0).toUpperCase()).join('');
          return (
            <button
              type="button"
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              aria-current={selectedId === conversation.id ? 'true' : undefined}
              className={cn(
                'flex min-h-18 w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                selectedId === conversation.id ? 'bg-primary/10' : 'hover:bg-muted/60'
              )}
            >
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {group ? <UsersRound className="h-5 w-5" aria-hidden="true" /> : initials || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{conversation.title}</span>
                  {conversation.lastMessage && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {conversation.lastMessage
                    ? `${group ? conversation.lastMessage.senderName + ': ' : ''}${conversation.lastMessage.content}`
                    : group ? `${conversation.members.length} participants` : 'Start your conversation'}
                </p>
                {group && <span className="text-xs text-muted-foreground">Group</span>}
              </div>
              {conversation.unreadCount > 0 && (
                <Badge className="min-w-6 justify-center rounded-full">
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
