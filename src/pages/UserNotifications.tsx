import { useState } from 'react';
import { format } from 'date-fns';
import { Bell, Check, Trash2, Filter, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Mapped to match backend 'type' values seamlessly
const categoryColors: Record<string, string> = {
  billing: 'bg-success/10 text-success border-success/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  lease: 'bg-primary/10 text-primary border-primary/20',
  general: 'bg-muted text-muted-foreground border-border',
};

export default function UserNotifications() {
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } = useInAppNotifications(user?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  const unreadCount = getUnreadCount();

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check against the backend-mapped category
    const matchesCategory = categoryFilter === 'all' || notification.category === categoryFilter;
    
    const matchesRead = readFilter === 'all' || 
      (readFilter === 'unread' && !notification.read) ||
      (readFilter === 'read' && notification.read);
    
    return matchesSearch && matchesCategory && matchesRead;
  });

  const formatCategory = (category?: string) => {
    if (!category) return 'General';
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <DashboardLayout
      title="My Notifications"
      breadcrumbs={[{ label: 'Notifications' }]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
          <div>
            <p className="font-medium">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
            <p className="text-sm text-muted-foreground">Manage your alerts and messages.</p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={() => markAllAsRead()}>
              <Check className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="lease">Lease</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={setReadFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
              <p className="text-lg font-medium">No Notifications Found</p>
              <p className="text-muted-foreground mt-1">
                {searchQuery || categoryFilter !== 'all' || readFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'You have no notifications yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const badgeColor = categoryColors[notification.category] || categoryColors.general;

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    'transition-all duration-200 overflow-hidden',
                    !notification.read ? 'border-primary/30 bg-primary/[0.02] shadow-sm' : 'shadow-none'
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={cn('text-xs px-2 py-0.5', badgeColor)}>
                            {formatCategory(notification.category)}
                          </Badge>
                          {!notification.read && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">New</Badge>
                          )}
                          <span className="text-xs font-medium text-muted-foreground/70 flex-shrink-0">
                            {notification.createdAt ? format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a') : 'Just now'}
                          </span>
                        </div>
                        <h3 className={cn("font-semibold mb-1 text-base", !notification.read && "text-primary")}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-2 mt-1 sm:mt-0">
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-full sm:w-auto text-xs"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete Notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}