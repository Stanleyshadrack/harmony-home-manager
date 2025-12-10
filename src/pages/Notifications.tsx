import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType, NotificationChannel } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

// Mock tenants for demo
const mockTenants = [
  { id: '1', name: 'John Mwangi', phone: '+254712345678', unit: 'Unit A1', rentAmount: 25000, dueDate: '2024-02-05' },
  { id: '2', name: 'Grace Wanjiku', phone: '+254723456789', unit: 'Unit B2', rentAmount: 30000, dueDate: '2024-02-05' },
  { id: '3', name: 'Peter Ochieng', phone: '+254734567890', unit: 'Unit C3', rentAmount: 22000, dueDate: '2024-02-05' },
  { id: '4', name: 'Mary Akinyi', phone: '+254745678901', unit: 'Unit D4', rentAmount: 28000, dueDate: '2024-02-05' },
];

const statusConfig = {
  sent: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

const Notifications = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { logs, isLoading, sendQuickNotification, sendBulkReminders, refreshLogs } = useNotifications();
  
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [notificationType, setNotificationType] = useState<NotificationType>('general');
  const [channel, setChannel] = useState<NotificationChannel>('sms');
  const [customMessage, setCustomMessage] = useState('');

  const handleSendSingle = async () => {
    const tenant = mockTenants.find(t => t.id === selectedTenant);
    if (!tenant) {
      toast({ title: 'Please select a tenant', variant: 'destructive' });
      return;
    }

    await sendQuickNotification(
      tenant.phone,
      tenant.name,
      notificationType,
      channel,
      {
        tenantName: tenant.name,
        amount: tenant.rentAmount,
        unit: tenant.unit,
        dueDate: tenant.dueDate,
        message: customMessage,
      }
    );
  };

  const handleSendBulkReminders = async () => {
    await sendBulkReminders(mockTenants);
  };

  const breadcrumbs = [
    { label: t('nav.dashboard'), href: '/dashboard' },
    { label: 'Notifications' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SMS & WhatsApp Notifications</h1>
            <p className="text-muted-foreground">Send notifications to tenants via SMS or WhatsApp (Twilio)</p>
          </div>
        </div>

        <Tabs defaultValue="send" className="space-y-4">
          <TabsList>
            <TabsTrigger value="send">Send Notification</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Single Notification
                </CardTitle>
                <CardDescription>
                  Send a notification to a specific tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Select Tenant</Label>
                    <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTenants.map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} - {tenant.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select value={channel} onValueChange={(v) => setChannel(v as NotificationChannel)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            SMS
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Notification Type</Label>
                    <Select value={notificationType} onValueChange={(v) => setNotificationType(v as NotificationType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent_reminder">Rent Reminder</SelectItem>
                        <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                        <SelectItem value="maintenance_update">Maintenance Update</SelectItem>
                        <SelectItem value="lease_expiry">Lease Expiry</SelectItem>
                        <SelectItem value="general">General Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {notificationType === 'general' && (
                  <div className="space-y-2">
                    <Label>Custom Message</Label>
                    <Textarea
                      placeholder="Enter your message..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <Button onClick={handleSendSingle} disabled={isLoading || !selectedTenant}>
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Bulk Rent Reminders
                </CardTitle>
                <CardDescription>
                  Send rent reminders to all tenants with upcoming due dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-2">This will send to {mockTenants.length} tenants:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {mockTenants.map(tenant => (
                      <li key={tenant.id}>
                        • {tenant.name} ({tenant.unit}) - KES {tenant.rentAmount.toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button onClick={handleSendBulkReminders} disabled={isLoading}>
                  <Bell className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send All Rent Reminders'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Button variant="outline" className="justify-start" disabled>
                  <Bell className="h-4 w-4 mr-2" />
                  Send Overdue Payment Notices
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Send Lease Expiry Reminders
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Maintenance Status Updates
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <Users className="h-4 w-4 mr-2" />
                  Water Bill Notifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Notification History</CardTitle>
                  <CardDescription>Recent notifications sent from the system</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={refreshLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="max-w-[200px]">Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No notifications sent yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => {
                          const status = statusConfig[log.status];
                          const StatusIcon = status.icon;
                          
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="uppercase">
                                  {log.channel}
                                </Badge>
                              </TableCell>
                              <TableCell className="capitalize">
                                {log.type.replace(/_/g, ' ')}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {log.recipient}
                              </TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${status.bg}`}>
                                  <StatusIcon className={`h-3 w-3 ${status.color}`} />
                                  <span className={`text-xs capitalize ${status.color}`}>{log.status}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-sm">
                                {log.message}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Setup Notice */}
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Bell className="h-6 w-6 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-600">Twilio Integration Required</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  To send real SMS and WhatsApp messages, you'll need to enable Lovable Cloud and configure your Twilio credentials. 
                  Currently, notifications are simulated for demonstration purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
