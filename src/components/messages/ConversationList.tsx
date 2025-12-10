import { Conversation } from '@/types/message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
}

const roleColors = {
  tenant: 'bg-blue-500',
  employee: 'bg-green-500',
  landlord: 'bg-purple-500',
};

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => {
          const otherParticipant = conversation.participants.find(
            (p) => p.userId !== 'current-user'
          );
          const isSelected = selectedId === conversation.id;

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
                isSelected
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted/50'
              )}
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherParticipant?.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {otherParticipant?.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                    otherParticipant && roleColors[otherParticipant.role]
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{otherParticipant?.name}</span>
                  {conversation.lastMessage && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>

                {conversation.subject && (
                  <p className="text-sm text-muted-foreground truncate">{conversation.subject}</p>
                )}

                {conversation.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {conversation.lastMessage.senderName === 'You' ? 'You: ' : ''}
                    {conversation.lastMessage.content}
                  </p>
                )}
              </div>

              {conversation.unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground h-5 min-w-[20px] flex items-center justify-center">
                  {conversation.unreadCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
