import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Droplets, MessageSquare, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useWaterData } from '@/hooks/useWaterData';
import { useConversations } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';

export function QuickStatsWidget() {
  const { t } = useTranslation();
  const { getPendingReadings, isLoading: waterLoading } = useWaterData();
  const { conversations, isLoading: messagesLoading } = useConversations();

  const pendingReadings = getPendingReadings();
  const unreadMessages = conversations.filter(c => c.unreadCount > 0);
  const recentMessages = conversations
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Pending Water Readings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            Pending Water Readings
          </CardTitle>
          <Badge variant={pendingReadings.length > 0 ? 'destructive' : 'secondary'}>
            {waterLoading ? '...' : pendingReadings.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {waterLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : pendingReadings.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-success" />
              All readings approved
            </div>
          ) : (
           <ScrollArea className="h-[120px]">
  <div className="space-y-2">
    {pendingReadings.slice(0, 5).map((reading) => (
      <div key={reading.id} className="flex items-start justify-between text-sm p-2 rounded-lg bg-muted/50">
        <div>
          <p className="font-medium">{reading.unitNumber}</p>
          <p className="text-xs text-muted-foreground">{reading.property}</p>
        </div>

        <div className="text-right">
          <p className="font-medium">{reading.consumption} units</p>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {reading.createdAt
              ? formatDistanceToNow(new Date(reading.createdAt), { addSuffix: true })
              : "Just now"}
          </p>
        </div>
      </div>
    ))}
  </div>
</ScrollArea>

          )}
          <Button asChild variant="ghost" size="sm" className="w-full mt-2 gap-1">
            <Link to="/water-data">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Recent Messages
          </CardTitle>
          {unreadMessages.length > 0 && (
            <Badge variant="destructive">
              {unreadMessages.reduce((sum, c) => sum + c.unreadCount, 0)} unread
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {messagesLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentMessages.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              No messages yet
            </div>
          ) : (
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {recentMessages.map((conv) => {
                  const otherParticipant = conv.participants.find(p => p.userId !== 'current-user') || conv.participants[0];
                  return (
                    <div key={conv.id} className={`flex items-start justify-between text-sm p-2 rounded-lg ${conv.unreadCount > 0 ? 'bg-primary/10' : 'bg-muted/50'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{otherParticipant?.name || conv.subject || 'Conversation'}</p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage?.content || 'No messages'}</p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          <Button asChild variant="ghost" size="sm" className="w-full mt-2 gap-1">
            <Link to="/messages">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
