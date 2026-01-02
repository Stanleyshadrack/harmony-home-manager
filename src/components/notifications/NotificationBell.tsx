import { useState } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInAppNotifications, InAppNotification } from '@/hooks/useInAppNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const categoryColors: Record<string, string> = {
  registration_approved: 'bg-success/10 text-success',
  registration_rejected: 'bg-destructive/10 text-destructive',
  payment_received: 'bg-success/10 text-success',
  maintenance_update: 'bg-info/10 text-info',
  rent_reminder: 'bg-warning/10 text-warning',
  lease_expiry: 'bg-warning/10 text-warning',
  task_assigned: 'bg-primary/10 text-primary',
  water_reading_pending: 'bg-warning/10 text-warning',
  water_reading_approved: 'bg-success/10 text-success',
  water_reading_rejected: 'bg-destructive/10 text-destructive',
  new_message: 'bg-info/10 text-info',
  general: 'bg-muted text-muted-foreground',
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } = useInAppNotifications(user?.id);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = getUnreadCount();

  const handleNotificationClick = (notification: InAppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 hover:bg-muted/50 cursor-pointer transition-colors',
                    !notification.read && 'bg-primary/5'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn('text-xs', categoryColors[notification.category])}>
                          {formatCategory(notification.category)}
                        </Badge>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {notification.link && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              navigate('/user-notifications');
              setIsOpen(false);
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
