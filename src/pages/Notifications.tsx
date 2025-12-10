import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  FileText,
  Megaphone,
  AlertTriangle,
  CalendarClock,
  Droplets,
  Wrench,
  Check,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType, NotificationChannel, sendBulkNotifications, NotificationPayload } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

// Mock tenants for demo
const mockTenants = [
  { id: '1', name: 'John Mwangi', phone: '+254712345678', email: 'john.mwangi@email.com', unit: 'Unit A1', property: 'Sunrise Apartments', rentAmount: 25000, dueDate: '2024-02-05', balance: 25000 },
  { id: '2', name: 'Grace Wanjiku', phone: '+254723456789', email: 'grace.wanjiku@email.com', unit: 'Unit B2', property: 'Sunrise Apartments', rentAmount: 30000, dueDate: '2024-02-05', balance: 15000 },
  { id: '3', name: 'Peter Ochieng', phone: '+254734567890', email: 'peter.ochieng@email.com', unit: 'Unit C3', property: 'Ocean View Towers', rentAmount: 22000, dueDate: '2024-02-05', balance: 0 },
  { id: '4', name: 'Mary Akinyi', phone: '+254745678901', email: 'mary.akinyi@email.com', unit: 'Unit D4', property: 'Ocean View Towers', rentAmount: 28000, dueDate: '2024-02-05', balance: 28000 },
  { id: '5', name: 'David Kamau', phone: '+254756789012', email: 'david.kamau@email.com', unit: 'Unit E5', property: 'Sunrise Apartments', rentAmount: 35000, dueDate: '2024-02-05', balance: 35000 },
];

// Notification templates
const notificationTemplates = [
  {
    id: 'rent_reminder',
    name: 'Rent Reminder',
    icon: Bell,
    description: 'Remind tenants about upcoming rent payments',
    category: 'billing',
    preview: 'Hi {name}, this is a reminder that your rent of KES {amount} for {unit} is due on {dueDate}.',
  },
  {
    id: 'overdue_notice',
    name: 'Overdue Payment Notice',
    icon: AlertTriangle,
    description: 'Notify tenants with overdue payments',
    category: 'billing',
    preview: 'Hi {name}, your rent payment of KES {balance} for {unit} is overdue. Please make payment immediately to avoid penalties.',
  },
  {
    id: 'lease_expiry',
    name: 'Lease Expiry Reminder',
    icon: CalendarClock,
    description: 'Remind tenants about expiring leases',
    category: 'lease',
    preview: 'Hi {name}, your lease for {unit} expires on {expiryDate}. Please contact management to discuss renewal.',
  },
  {
    id: 'water_bill',
    name: 'Water Bill Notification',
    icon: Droplets,
    description: 'Notify tenants about new water bills',
    category: 'billing',
    preview: 'Hi {name}, your water bill of KES {amount} for {billingPeriod} is now available. Due date: {dueDate}.',
  },
  {
    id: 'maintenance_scheduled',
    name: 'Maintenance Scheduled',
    icon: Wrench,
    description: 'Notify tenants about scheduled maintenance',
    category: 'maintenance',
    preview: 'Hi {name}, maintenance has been scheduled for {unit} on {scheduledDate}. A technician will visit between {timeSlot}.',
  },
  {
    id: 'announcement',
    name: 'General Announcement',
    icon: Megaphone,
    description: 'Send custom announcements to all tenants',
    category: 'general',
    preview: '{customMessage}',
  },
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
  
  // Single notification state
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [notificationType, setNotificationType] = useState<NotificationType>('general');
  const [channel, setChannel] = useState<NotificationChannel>('sms');
  const [customMessage, setCustomMessage] = useState('');

  // Bulk notification state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [bulkChannel, setBulkChannel] = useState<NotificationChannel>('sms');
  const [bulkCustomMessage, setBulkCustomMessage] = useState('');
  const [isSendingBulk, setIsSendingBulk] = useState(false);

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

  const handleSelectAllTenants = (checked: boolean) => {
    if (checked) {
      setSelectedTenants(mockTenants.map(t => t.id));
    } else {
      setSelectedTenants([]);
    }
  };

  const handleToggleTenant = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSendBulkNotifications = async () => {
    if (selectedTenants.length === 0) {
      toast({ title: 'Please select at least one tenant', variant: 'destructive' });
      return;
    }

    if (!selectedTemplate) {
      toast({ title: 'Please select a template', variant: 'destructive' });
      return;
    }

    if (selectedTemplate === 'announcement' && !bulkCustomMessage.trim()) {
      toast({ title: 'Please enter a message for the announcement', variant: 'destructive' });
      return;
    }

    setIsSendingBulk(true);

    try {
      const tenantsToNotify = mockTenants.filter(t => selectedTenants.includes(t.id));
      
      const payloads: NotificationPayload[] = tenantsToNotify.map(tenant => {
        let messageData: Record<string, string | number> = {
          tenantName: tenant.name,
          name: tenant.name,
          amount: tenant.rentAmount,
          balance: tenant.balance,
          unit: tenant.unit,
          property: tenant.property,
          dueDate: tenant.dueDate,
        };

        if (selectedTemplate === 'announcement') {
          messageData.message = bulkCustomMessage;
        }

        // Map template to notification type
        let type: NotificationType = 'general';
        if (selectedTemplate === 'rent_reminder') type = 'rent_reminder';
        else if (selectedTemplate === 'overdue_notice') type = 'rent_reminder';
        else if (selectedTemplate === 'lease_expiry') type = 'lease_expiry';
        else if (selectedTemplate === 'maintenance_scheduled') type = 'maintenance_update';
        else if (selectedTemplate === 'announcement') type = 'general';

        return {
          recipientPhone: tenant.phone,
          recipientName: tenant.name,
          type,
          channel: bulkChannel,
          data: messageData,
        };
      });

      const results = await sendBulkNotifications(payloads);
      const successCount = results.filter(r => r.status === 'sent').length;
      const failCount = results.filter(r => r.status === 'failed').length;

      toast({
        title: 'Bulk Notification Complete',
        description: `Sent: ${successCount}, Failed: ${failCount}`,
      });

      // Reset form
      setSelectedTenants([]);
      setSelectedTemplate('');
      setBulkCustomMessage('');
      refreshLogs();
    } catch (error) {
      toast({
        title: 'Failed to send notifications',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSendingBulk(false);
    }
  };

  const currentTemplate = notificationTemplates.find(t => t.id === selectedTemplate);

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
            <p className="text-muted-foreground">Send notifications to tenants via SMS, WhatsApp, or Email</p>
          </div>
        </div>

        <Tabs defaultValue="bulk" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bulk" className="gap-2">
              <Users className="h-4 w-4" />
              Bulk Send
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="single" className="gap-2">
              <Send className="h-4 w-4" />
              Single Send
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Bulk Send Tab */}
          <TabsContent value="bulk" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Template Selection */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Select Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notificationTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${selectedTemplate === template.id ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-4 w-4 ${selectedTemplate === template.id ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                          </div>
                          {selectedTemplate === template.id && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Tenant Selection */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Select Recipients
                      </CardTitle>
                      <CardDescription>
                        {selectedTenants.length} of {mockTenants.length} tenants selected
                      </CardDescription>
                    </div>
                    <Select value={bulkChannel} onValueChange={(v) => setBulkChannel(v as NotificationChannel)}>
                      <SelectTrigger className="w-40">
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
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedTenants.length === mockTenants.length}
                              onCheckedChange={handleSelectAllTenants}
                            />
                          </TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockTenants.map((tenant) => (
                          <TableRow 
                            key={tenant.id}
                            className={selectedTenants.includes(tenant.id) ? 'bg-primary/5' : ''}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedTenants.includes(tenant.id)}
                                onCheckedChange={() => handleToggleTenant(tenant.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{tenant.name}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{tenant.unit}</p>
                                <p className="text-muted-foreground text-xs">{tenant.property}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-mono">{tenant.phone}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={tenant.balance > 0 ? 'text-destructive font-medium' : 'text-success'}>
                                KES {tenant.balance.toLocaleString()}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Custom Message for Announcement */}
                  {selectedTemplate === 'announcement' && (
                    <div className="mt-4 space-y-2">
                      <Label>Announcement Message</Label>
                      <Textarea
                        placeholder="Enter your announcement message..."
                        value={bulkCustomMessage}
                        onChange={(e) => setBulkCustomMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Preview */}
                  {currentTemplate && selectedTenants.length > 0 && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Message Preview:</p>
                      <p className="text-sm">
                        {selectedTemplate === 'announcement' 
                          ? bulkCustomMessage || 'Enter your message above...'
                          : currentTemplate.preview
                              .replace('{name}', mockTenants[0]?.name || 'Tenant')
                              .replace('{amount}', 'XX,XXX')
                              .replace('{balance}', 'XX,XXX')
                              .replace('{unit}', mockTenants[0]?.unit || 'Unit')
                              .replace('{dueDate}', 'DD/MM/YYYY')
                        }
                      </p>
                    </div>
                  )}

                  {/* Send Button */}
                  <div className="mt-4 flex justify-end">
                    <Button 
                      onClick={handleSendBulkNotifications}
                      disabled={isSendingBulk || selectedTenants.length === 0 || !selectedTemplate}
                      size="lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSendingBulk ? 'Sending...' : `Send to ${selectedTenants.length} Tenant${selectedTenants.length !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notificationTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card key={template.id} className="relative overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs capitalize">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Preview:</p>
                        <p className="text-xs">{template.preview}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Single Send Tab */}
          <TabsContent value="single" className="space-y-4">
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
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
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

          {/* History Tab */}
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
