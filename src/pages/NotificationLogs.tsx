import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationLog, clearNotificationLogs } from '@/services/notificationService';
import { getEmailHistory, clearEmailHistory } from '@/services/emailService';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Search,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  RefreshCw,
  Send,
  Filter,
  Download,
  Receipt,
} from 'lucide-react';

export default function NotificationLogs() {
  const { t } = useTranslation();
  const { logs, refreshLogs } = useNotifications();
  const [emailLogs, setEmailLogs] = useState(getEmailHistory());
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const refreshEmailLogs = () => {
    setEmailLogs(getEmailHistory());
  };

  // Combine notification and email logs for "all" view
  const combinedLogs = useMemo(() => {
    const smsLogs = logs.map(log => ({
      ...log,
      source: 'sms' as const,
    }));
    
    const emails = emailLogs.map(log => ({
      id: log.id,
      type: log.type,
      channel: 'email' as const,
      recipient: log.recipient.email,
      recipientName: log.recipient.name,
      message: log.subject,
      status: log.status,
      timestamp: log.sentAt,
      metadata: log.metadata,
      source: 'email' as const,
      error: undefined as string | undefined,
    }));
    
    return [...smsLogs, ...emails].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [logs, emailLogs]);

  const filteredLogs = combinedLogs.filter((log) => {
    const matchesSearch = 
      log.recipient.toLowerCase().includes(search.toLowerCase()) ||
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.type.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || log.channel === channelFilter;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'sms' && log.source === 'sms') ||
      (activeTab === 'email' && log.source === 'email');
    
    return matchesSearch && matchesStatus && matchesChannel && matchesTab;
  });

  const stats = {
    total: combinedLogs.length,
    sent: combinedLogs.filter(l => l.status === 'sent').length,
    failed: combinedLogs.filter(l => l.status === 'failed').length,
    pending: combinedLogs.filter(l => l.status === 'pending').length,
    emails: emailLogs.length,
    sms: logs.length,
  };

  const getStatusBadge = (status: NotificationLog['status']) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-success/10 text-success border-success/20 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Sent
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const getChannelIcon = (channel: NotificationLog['channel']) => {
    switch (channel) {
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
    }
  };

  const handleClearLogs = () => {
    clearNotificationLogs();
    clearEmailHistory();
    refreshLogs();
    refreshEmailLogs();
    setShowClearDialog(false);
    toast.success('All notification logs cleared');
  };

  const handleRefresh = () => {
    refreshLogs();
    refreshEmailLogs();
    toast.success('Logs refreshed');
  };

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'Channel', 'Recipient', 'Message', 'Status', 'Error'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.type,
        log.channel,
        log.recipient,
        `"${log.message.replace(/"/g, '""')}"`,
        log.status,
        log.error || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported successfully');
  };

  return (
    <DashboardLayout
      title="Notification Logs"
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: 'Notification Logs' },
      ]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sent}</p>
              <p className="text-sm text-muted-foreground">Delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.failed}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.emails}</p>
              <p className="text-sm text-muted-foreground">Emails</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Phone className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sms}</p>
              <p className="text-sm text-muted-foreground">SMS/WhatsApp</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View all sent SMS, WhatsApp, and Email notifications
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={combinedLogs.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowClearDialog(true)}
                disabled={combinedLogs.length === 0}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Send className="h-4 w-4" />
                All ({combinedLogs.length})
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                Emails ({emailLogs.length})
              </TabsTrigger>
              <TabsTrigger value="sms" className="gap-2">
                <Phone className="h-4 w-4" />
                SMS/WhatsApp ({logs.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by recipient, message, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No notifications found</h3>
              <p className="text-sm text-muted-foreground">
                {combinedLogs.length === 0 
                  ? 'Notifications will appear here once sent. Try recording a payment and sending a receipt email.' 
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead className="max-w-xs">Message</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(log.channel)}
                          <span className="capitalize text-sm">{log.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs gap-1">
                          {log.type === 'payment_receipt' && <Receipt className="h-3 w-3" />}
                          {log.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {'recipientName' in log && log.recipientName && (
                            <span className="text-sm font-medium">{log.recipientName}</span>
                          )}
                          <span className="font-mono text-sm text-muted-foreground">{log.recipient}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {log.message}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(log.status)}
                          {log.error && (
                            <span className="text-xs text-destructive">{log.error}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear Confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Notification Logs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all notification logs? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearLogs} className="bg-destructive text-destructive-foreground">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
