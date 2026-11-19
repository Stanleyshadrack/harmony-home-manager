import type { Conversation } from '@/types/message';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/profile/UserAvatar';
import { LastSeen } from '@/components/presence/LastSeen';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: number | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const { user } = useAuth();
  return (
    <ScrollArea className="h-full max-h-full">
      <div className="space-y-1 p-2">
        {conversations.map(conversation => {
          const group = conversation.type === 'GROUP';
          const counterpart = conversation.members.find(member => member.userId !== Number(user?.id));
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
              <UserAvatar name={conversation.title}
                avatarUrl={group ? conversation.avatarUrl : counterpart?.avatarUrl}
                online={!group && counterpart?.online}
                className="h-11 w-11" />
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
                {group ? (
                  <span className="text-xs text-muted-foreground">
                    Group · {conversation.members.filter(member => member.online).length} online
                  </span>
                ) : <LastSeen online={counterpart?.online} lastSeenAt={counterpart?.lastSeenAt} />}
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
