import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Settings,
  Search,
  MoreHorizontal,
  UserPlus,
  Eye,
  Ban,
  CheckCircle,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  UserCheck,
  XCircle,
  Clock,
  Wrench,
  User,
  Lock,
  Key,
  Edit,
  CreditCard,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { useTenants } from '@/hooks/useTenants';
import { useBilling } from '@/hooks/useBilling';
import { usePendingRegistrations, PendingRegistration } from '@/hooks/useRegistrations';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { useLandlords, Landlord } from '@/hooks/useLandlords';
import { getAuditLogs, getActivitySummary } from '@/services/auditService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LandlordForm } from '@/components/admin/LandlordForm';
import { SystemLockControl } from '@/components/admin/SystemLockControl';
import { UserPasswordReset } from '@/components/admin/UserPasswordReset';
import { BulkEmailForm } from '@/components/admin/BulkEmailForm';
import { SubscriptionRenewalDialog } from '@/components/landlords/SubscriptionRenewalDialog';
import { sendSubscriptionRenewalConfirmationEmail, sendUserInvitationEmail } from '@/services/adminEmailService';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { useInvitations } from '@/hooks/useInvitations';

export default function AdminPortal() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { properties } = useProperties();
  const { tenants } = useTenants();
  const { invoices, payments } = useBilling();
  const { user } = useAuth();
  const { registrations, approveRegistration, rejectRegistration, getPendingCount } = usePendingRegistrations();
  const {
    landlords,
    subscriptionPlans,
    addLandlord,
    updateLandlord,
    suspendLandlord,
    activateLandlord,
    updateSubscription,
    isSubscriptionExpired,
    renewSubscription,
    getDaysUntilExpiration,
    getExpiredSubscriptions,
  } = useLandlords();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null);
  const [showLandlordDialog, setShowLandlordDialog] = useState(false);
  const [showLandlordForm, setShowLandlordForm] = useState(false);
  const [landlordFormMode, setLandlordFormMode] = useState<'add' | 'edit'>('add');
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [renewalLandlord, setRenewalLandlord] = useState<Landlord | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const { createInvitation, invitations, getPendingInvitations } = useInvitations();

  const auditLogs = getAuditLogs();
  const activitySummary = getActivitySummary();

  // Platform Stats
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalLandlords = landlords.length;
  const activeLandlords = landlords.filter((l) => l.status === 'active').length;
  const totalProperties = properties.length;
  const totalUnits = landlords.reduce((sum, l) => sum + l.currentUnits, 0);
  const expiredSubscriptions = getExpiredSubscriptions();

  const filteredLandlords = landlords.filter(
    (l) =>
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewLandlord = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setShowLandlordDialog(true);
  };

  const handleEditLandlord = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setLandlordFormMode('edit');
    setShowLandlordForm(true);
  };

  const handleAddLandlord = () => {
    setSelectedLandlord(null);
    setLandlordFormMode('add');
    setShowLandlordForm(true);
  };

  const handleLandlordFormSubmit = (data: any) => {
    if (landlordFormMode === 'add') {
      addLandlord({
        ...data,
        status: 'active',
        subscriptionStartDate: new Date().toISOString(),
      });
      toast({
        title: 'Landlord Added',
        description: `${data.firstName} ${data.lastName} has been added successfully.`,
      });
    } else if (selectedLandlord) {
      updateLandlord(selectedLandlord.id, data);
      toast({
        title: 'Landlord Updated',
        description: `${data.firstName} ${data.lastName}'s profile has been updated.`,
      });
    }
    setShowLandlordForm(false);
  };

  const handleSuspendLandlord = (id: string) => {
    suspendLandlord(id);
    toast({
      title: 'Landlord Suspended',
      description: 'The landlord account has been suspended.',
    });
  };

  const handleActivateLandlord = (id: string) => {
    activateLandlord(id);
    toast({
      title: 'Landlord Activated',
      description: 'The landlord account has been activated.',
    });
  };

  const handleOpenRenewalDialog = (landlord: Landlord) => {
    setRenewalLandlord(landlord);
    setShowRenewalDialog(true);
  };

  const handleRenewSubscription = async (landlordId: string, plan: string, paymentData: any) => {
    const landlord = landlords.find(l => l.id === landlordId);
    if (!landlord) return;

    const planDetails = subscriptionPlans.find(p => p.id === plan);
    
    // Process renewal
    updateSubscription(landlordId, plan as any);

    // Send confirmation email
    await sendSubscriptionRenewalConfirmationEmail({
      landlordName: `${landlord.firstName} ${landlord.lastName}`,
      landlordEmail: landlord.email,
      planName: planDetails?.name || plan,
      amount: (planDetails?.price || 0) * 12,
      newExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      transactionId: `TXN-${Date.now()}`,
    });

    setShowRenewalDialog(false);
    setRenewalLandlord(null);
  };

  // Recipient groups for bulk email
  const bulkEmailRecipientGroups = [
    { id: 'landlords', label: 'All Landlords', icon: <Building2 className="h-4 w-4" />, count: landlords.length },
    { id: 'tenants', label: 'All Tenants', icon: <Users className="h-4 w-4" />, count: tenants.length },
    { id: 'employees', label: 'All Employees', icon: <Wrench className="h-4 w-4" />, count: 5 },
    { id: 'active_landlords', label: 'Active Landlords', icon: <CheckCircle className="h-4 w-4" />, count: activeLandlords },
  ];

  const { addNotification } = useInAppNotifications();

  const handleApproveRegistration = async (registration: PendingRegistration) => {
    await approveRegistration(registration.id, user?.email || 'Admin');
    
    addNotification({
      userId: registration.phone,
      title: 'Registration Approved!',
      message: `Your ${registration.requestedRole} account has been approved. You can now log in to the system.`,
      category: 'registration_approved',
      priority: 'high',
      link: '/auth',
    });

    toast({
      title: 'Registration Approved',
      description: `${registration.firstName} ${registration.lastName}'s ${registration.requestedRole} account has been approved.`,
    });
  };

  const handleRejectRegistration = async () => {
    if (selectedRegistration && rejectionReason.trim()) {
      await rejectRegistration(selectedRegistration.id, user?.email || 'Admin', rejectionReason);
      
      addNotification({
        userId: selectedRegistration.phone,
        title: 'Registration Rejected',
        message: `Your ${selectedRegistration.requestedRole} registration was not approved. Reason: ${rejectionReason}`,
        category: 'registration_rejected',
        priority: 'high',
      });

      toast({
        title: 'Registration Rejected',
        description: `${selectedRegistration.firstName} ${selectedRegistration.lastName}'s application has been rejected.`,
      });
      setShowRejectDialog(false);
      setSelectedRegistration(null);
      setRejectionReason('');
    } else {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
    }
  };

  const pendingRegistrations = registrations.filter((r) => r.status === 'pending');
  const pendingCount = getPendingCount();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'tenant':
        return <User className="h-4 w-4" />;
      case 'employee':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Super Admin Portal' }]}
      title="Super Admin Portal"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Platform Administration</h1>
            <p className="text-muted-foreground">
              Manage landlords, system settings, and user accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <Shield className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Landlords</p>
                  <p className="text-xl font-bold">{totalLandlords}</p>
                  <p className="text-xs text-success">{activeLandlords} active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-info/10">
                  <Building2 className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Properties</p>
                  <p className="text-xl font-bold">{totalProperties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/10">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="text-xl font-bold">{totalUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <Activity className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Audit Events</p>
                  <p className="text-xl font-bold">{auditLogs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2 relative">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Approvals</span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="landlords" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Landlords</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Audit</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Landlords */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Landlords</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {landlords.slice(0, 5).map((landlord) => (
                    <div
                      key={landlord.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {landlord.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{landlord.firstName} {landlord.lastName}</p>
                          <p className="text-sm text-muted-foreground">{landlord.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            landlord.status === 'active'
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
                          }
                        >
                          {landlord.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {landlord.currentProperties} properties
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-info/10 rounded-lg">
                      <p className="text-2xl font-bold text-info">{activitySummary.bySeverity.info || 0}</p>
                      <p className="text-sm text-muted-foreground">Info</p>
                    </div>
                    <div className="text-center p-4 bg-warning/10 rounded-lg">
                      <p className="text-2xl font-bold text-warning">{activitySummary.bySeverity.warning || 0}</p>
                      <p className="text-sm text-muted-foreground">Warnings</p>
                    </div>
                    <div className="text-center p-4 bg-destructive/10 rounded-lg">
                      <p className="text-2xl font-bold text-destructive">{activitySummary.bySeverity.critical || 0}</p>
                      <p className="text-sm text-muted-foreground">Critical</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <h4 className="font-medium">Recent Activity</h4>
                    {auditLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                      >
                        <span className="text-muted-foreground">{log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.severity}
                        </Badge>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {landlords.filter((l) => l.status === 'suspended').length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <Ban className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="font-medium">Suspended Accounts</p>
                          <p className="text-sm text-muted-foreground">
                            {landlords.filter((l) => l.status === 'suspended').length} landlord account(s) are suspended
                          </p>
                        </div>
                      </div>
                    )}
                    {expiredSubscriptions.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                        <CreditCard className="h-5 w-5 text-warning" />
                        <div>
                          <p className="font-medium">Expired Subscriptions</p>
                          <p className="text-sm text-muted-foreground">
                            {expiredSubscriptions.length} subscription(s) have expired
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-info/5 border border-info/20 rounded-lg">
                      <Activity className="h-5 w-5 text-info" />
                      <div>
                        <p className="font-medium">System Health</p>
                        <p className="text-sm text-muted-foreground">
                          All systems operational. Last check: Just now
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Registration Approvals</h2>
                <p className="text-muted-foreground">
                  Review and approve employee and tenant registration requests
                </p>
              </div>
              {pendingCount > 0 && (
                <Badge variant="destructive">{pendingCount} pending</Badge>
              )}
            </div>

            {pendingRegistrations.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRegistrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {reg.firstName.charAt(0)}
                            </div>
                            <span className="font-medium">{reg.firstName} {reg.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            {getRoleIcon(reg.requestedRole)}
                            <span className="capitalize">{reg.requestedRole}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{reg.phone}</p>
                            <p className="text-muted-foreground">ID: {reg.idNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(reg.submittedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" onClick={() => handleApproveRegistration(reg)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => {
                                setSelectedRegistration(reg);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Pending Registrations</p>
                  <p className="text-muted-foreground">All registration requests have been processed</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Landlords Tab */}
          <TabsContent value="landlords" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search landlords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAddLandlord}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Landlord
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLandlords.map((landlord) => (
                    <TableRow key={landlord.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {landlord.firstName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium">{landlord.firstName} {landlord.lastName}</span>
                            {landlord.company && (
                              <p className="text-xs text-muted-foreground">{landlord.company}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{landlord.email}</p>
                          <p className="text-muted-foreground">{landlord.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{landlord.currentProperties}/{landlord.maxProperties} properties</p>
                          <p className="text-muted-foreground">{landlord.currentUnits}/{landlord.maxUnits} units</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {landlord.subscription}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            landlord.status === 'active'
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
                          }
                        >
                          {landlord.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={isSubscriptionExpired(landlord) ? 'text-destructive' : 'text-muted-foreground'}>
                        {formatDate(landlord.subscriptionEndDate)}
                        {isSubscriptionExpired(landlord) && (
                          <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewLandlord(landlord)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditLandlord(landlord)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenRenewalDialog(landlord)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Renew Subscription
                            </DropdownMenuItem>
                            {landlord.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={() => handleSuspendLandlord(landlord.id)}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivateLandlord(landlord.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Users Tab - Password Reset */}
          <TabsContent value="users" className="space-y-4">
            <UserPasswordReset />
          </TabsContent>

          {/* Announcements Tab - Bulk Email */}
          <TabsContent value="announcements" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">System Announcements</h2>
              <p className="text-muted-foreground">
                Send bulk email notifications to users across the platform
              </p>
            </div>
            <BulkEmailForm recipientGroups={bulkEmailRecipientGroups} />
          </TabsContent>

          {/* System Lock Tab */}
          <TabsContent value="system" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">System Lock Control</h2>
              <p className="text-muted-foreground">
                Lock the system to prevent access during maintenance or emergencies
              </p>
            </div>
            <SystemLockControl />
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Audit Logs</CardTitle>
                <CardDescription>
                  View all system activities and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.slice(0, 20).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            log.severity === 'critical'
                              ? 'bg-destructive'
                              : log.severity === 'warning'
                              ? 'bg-warning'
                              : 'bg-info'
                          }`}
                        />
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.userName} • {log.userRole}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{log.severity}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {typeof log.timestamp === 'string' ? formatDate(log.timestamp) : formatDate(log.timestamp.toISOString())}
                        </p>
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No Audit Logs</p>
                      <p className="text-muted-foreground">System activity will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>Configure global platform settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Disable platform access</p>
                    </div>
                    <Badge variant="outline">Off</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">New Registrations</p>
                      <p className="text-sm text-muted-foreground">Allow new landlord signups</p>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      Enabled
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Plans</CardTitle>
                  <CardDescription>Available subscription tiers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscriptionPlans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Up to {plan.maxUnits} units
                        </p>
                      </div>
                      <span className="font-semibold">${plan.price}/mo</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Landlord Details Dialog */}
      <Dialog open={showLandlordDialog} onOpenChange={setShowLandlordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Landlord Details</DialogTitle>
          </DialogHeader>
          {selectedLandlord && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-semibold">
                  {selectedLandlord.firstName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedLandlord.firstName} {selectedLandlord.lastName}</h3>
                  <p className="text-muted-foreground">{selectedLandlord.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Properties</p>
                  <p className="text-xl font-bold">{selectedLandlord.currentProperties}/{selectedLandlord.maxProperties}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Units</p>
                  <p className="text-xl font-bold">{selectedLandlord.currentUnits}/{selectedLandlord.maxUnits}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{selectedLandlord.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span>{selectedLandlord.company || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscription</span>
                  <Badge variant="secondary" className="capitalize">
                    {selectedLandlord.subscription}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={
                      selectedLandlord.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }
                  >
                    {selectedLandlord.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{formatDate(selectedLandlord.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscription Expires</span>
                  <span className={isSubscriptionExpired(selectedLandlord) ? 'text-destructive' : ''}>
                    {formatDate(selectedLandlord.subscriptionEndDate)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLandlordDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Landlord Form Dialog */}
      <LandlordForm
        open={showLandlordForm}
        onOpenChange={setShowLandlordForm}
        onSubmit={handleLandlordFormSubmit}
        landlord={selectedLandlord}
        subscriptionPlans={subscriptionPlans}
        mode={landlordFormMode}
      />

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject Registration
            </DialogTitle>
            <DialogDescription>
              {selectedRegistration && (
                <>
                  Reject the registration request from <strong>{selectedRegistration.firstName} {selectedRegistration.lastName}</strong> ({selectedRegistration.requestedRole}).
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a clear reason for rejecting this registration..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick select:</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Incomplete application',
                  'Unable to verify identity',
                  'Does not meet requirements',
                  'Duplicate registration',
                ].map((reason) => (
                  <Button
                    key={reason}
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectionReason(reason)}
                    className="text-xs"
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedRegistration(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRegistration}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Renewal Dialog */}
      {renewalLandlord && (
        <SubscriptionRenewalDialog
          open={showRenewalDialog}
          onOpenChange={setShowRenewalDialog}
          landlord={renewalLandlord}
          subscriptionPlans={subscriptionPlans}
          onRenew={handleRenewSubscription}
        />
      )}

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        inviterRole={user?.role || 'super_admin'}
        onInvite={async (data) => {
          const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin';
          const invitation = await createInvitation(
            { email: data.email, firstName: data.firstName, lastName: data.lastName, role: data.role, message: data.message },
            {
              name: userName,
              email: user?.email || 'admin@system.com',
              role: user?.role || 'super_admin',
            }
          );
          await sendUserInvitationEmail({
            recipientEmail: data.email,
            recipientName: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : undefined,
            inviterName: userName,
            inviterEmail: user?.email || 'admin@system.com',
            role: data.role,
            message: data.message,
            invitationToken: invitation.token,
            expiresAt: invitation.expiresAt,
          });
        }}
      />
    </DashboardLayout>
  );
}
