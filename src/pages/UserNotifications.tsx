import { useState } from 'react';
import { format } from 'date-fns';
import { Bell, Check, Trash2, Filter, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInAppNotifications, NotificationCategory } from '@/hooks/useInAppNotifications';
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
  general: 'bg-muted text-muted-foreground',
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
    const matchesCategory = categoryFilter === 'all' || notification.category === categoryFilter;
    const matchesRead = readFilter === 'all' || 
      (readFilter === 'unread' && !notification.read) ||
      (readFilter === 'read' && notification.read);
    return matchesSearch && matchesCategory && matchesRead;
  });

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <DashboardLayout
      title="My Notifications"
      breadcrumbs={[{ label: 'Notifications' }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
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
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="registration_approved">Approved</SelectItem>
              <SelectItem value="registration_rejected">Rejected</SelectItem>
              <SelectItem value="payment_received">Payments</SelectItem>
              <SelectItem value="maintenance_update">Maintenance</SelectItem>
              <SelectItem value="rent_reminder">Rent Reminders</SelectItem>
              <SelectItem value="task_assigned">Task Assigned</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={setReadFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">No Notifications</p>
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== 'all' || readFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'You have no notifications yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(
                  'transition-colors',
                  !notification.read && 'border-primary/30 bg-primary/5'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={cn('text-xs', categoryColors[notification.category])}>
                          {formatCategory(notification.category)}
                        </Badge>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{notification.title}</h3>
                      <p className="text-muted-foreground">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
