import { useRef, useEffect } from 'react';
import { Message } from '@/types/message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MoreVertical, Forward, Copy, Reply } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageThreadProps {
  messages: Message[];
  isLoading?: boolean;
  onForward?: (message: Message) => void;
}

const roleColors = {
  tenant: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  employee: 'bg-green-500/10 text-green-600 border-green-500/20',
  landlord: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export function MessageThread({ messages, isLoading, onForward }: MessageThreadProps) {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-24rem)] px-4" ref={scrollRef}>
      <div className="space-y-4 py-4">
        {messages.map((message) => {
          const isOwn = message.senderId === 'current-user';

          return (
            <div
              key={message.id}
              className={cn('flex gap-3', isOwn && 'flex-row-reverse')}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {message.senderName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>

              <div className={cn('max-w-[70%]', isOwn && 'items-end')}>
                <div className={cn('flex items-center gap-2 mb-1', isOwn && 'flex-row-reverse')}>
                  <span className="text-sm font-medium">{message.senderName}</span>
                  <Badge variant="outline" className={cn('text-xs', roleColors[message.senderRole])}>
                    {message.senderRole}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </span>
                </div>

                <div
                  className={cn(
                    'rounded-lg p-3 relative group',
                    isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {message.isForwarded && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs mb-1',
                        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      <Forward className="h-3 w-3" />
                      <span>Forwarded from {message.forwardedFrom}</span>
                    </div>
                  )}

                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
                          isOwn
                            ? 'text-primary-foreground hover:bg-primary-foreground/10'
                            : 'hover:bg-background'
                        )}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isOwn ? 'start' : 'end'}>
                      <DropdownMenuItem onClick={() => handleCopy(message.content)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      {onForward && (
                        <DropdownMenuItem onClick={() => onForward(message)}>
                          <Forward className="h-4 w-4 mr-2" />
                          Forward
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
