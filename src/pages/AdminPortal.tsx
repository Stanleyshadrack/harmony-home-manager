import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { ResponsiveTableView } from '@/components/ui/responsive-table-view';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PropertyApi } from '@/api/service/add.apartments.service.api';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApprovals } from "@/hooks/useApprovals";
import { TenantWorkflowApprovals } from '@/components/tenants/TenantWorkflowApprovals';
import { Approval } from "@/api/dto/approval.dto";
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
  CreditCard,
  Mail,
} from 'lucide-react';
import { useProperties, useUnits } from '@/hooks/useProperties';
import { useTenants } from '@/hooks/useTenants';
import { useBilling } from '@/hooks/useBilling';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { useLandlords } from '@/hooks/useLandlords';
import { getAuditLogs, getActivitySummary } from '@/services/auditService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SystemLockControl } from '@/components/admin/SystemLockControl';
import { CompanyManagement } from '@/components/admin/CompanyManagement';
import { UserPasswordReset } from '@/components/admin/UserPasswordReset';
import { BulkEmailForm } from '@/components/admin/BulkEmailForm';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { AssignPropertiesDialog } from '@/components/properties/AssignPropertiesDialog';
import { LandlordTypes } from '@/types/LandlordTypes';

export default function AdminPortal() {
  const [viewMode, setViewMode] = useViewMode('admin-portal', 'list');
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { properties, loadError: propertyLoadError } = useProperties();
  const { units, loadError: unitsLoadError } = useUnits();
  const { tenants } = useTenants();
  const { invoices, payments, loadError: billingLoadError } = useBilling();
  const { user } = useAuth();
  const [showApprovalDetails, setShowApprovalDetails] = useState(false);
  const {
  approvals,
  approve,
  reject,
  pendingCount
} = useApprovals();

  const {
    landlords,
    subscriptionPlans,
    updateLandlord,
    isSubscriptionExpired,
    getExpiredSubscriptions,
  } = useLandlords();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLandlord, setSelectedLandlord] = useState<LandlordTypes  | null>(null);
  const [showLandlordDialog, setShowLandlordDialog] = useState(false);
const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
const [approvalLoading, setApprovalLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteStartRole, setInviteStartRole] = useState<'TENANT' | 'LANDLORD'>('TENANT');
   const [showAssignPropertiesDialog, setShowAssignPropertiesDialog] = useState(false);
  const [assignPropertiesLandlord, setAssignPropertiesLandlord] = useState<LandlordTypes  | null>(null);
  const auditLogs = getAuditLogs();
  const activitySummary = getActivitySummary();


  // const inviteUser = 

  // Platform Stats
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalLandlords = landlords.length;
  const activeLandlords = landlords.filter((l) => l.status === 'active').length;
  const totalProperties = properties.length;
  const totalUnits = units.length;
  // A subscription belongs to a company, so do not count it once per landlord.
  const expiredSubscriptions = getExpiredSubscriptions().filter(
    (landlord, index, all) => all.findIndex(other =>
      (other.companyId ?? other.company ?? other.id) === (landlord.companyId ?? landlord.company ?? landlord.id)
    ) === index
  );

  const filteredLandlords = landlords.filter(
    (l) =>
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewLandlord = (landlord: LandlordTypes ) => {
    setSelectedLandlord(landlord);
    setShowLandlordDialog(true);
  };

  // New landlords must be invited with an existing company.
  const handleAddLandlord = () => {
    setInviteStartRole('LANDLORD');
    setShowInviteDialog(true);
  };

  // Handle property assignment
  const handleOpenAssignProperties = (landlord: LandlordTypes ) => {
    setAssignPropertiesLandlord(landlord);
    setShowAssignPropertiesDialog(true);
  };
  // Persist assignments in PostgreSQL through the property API,
  // never browser storage. The company is authoritative.
  const getAssignedPropertyIds = (landlordId: string): string[] => {
    const id = Number(landlordId);
    return properties.filter(p => (p.landlordIds ?? []).includes(id)).map(p => p.id);
  };

  const handleSavePropertyAssignment = async (landlordId: string, propertyIds: string[]): Promise<void> => {
    const landlord = landlords.find(l => String(l.id) === landlordId);
    if (!landlord || landlord.companyId == null) {
      throw new Error('This landlord must be attached to a company before assigning properties.');
    }
    const owned = properties.filter(p => p.companyId === landlord.companyId);
    const allowedIds = new Set(owned.map(p => p.id));
    if (propertyIds.some(id => !allowedIds.has(id))) {
      throw new Error('You can only assign properties belonging to the landlord company.');
    }

    const previousIds = new Set(getAssignedPropertyIds(landlordId));
    const selectedIds = new Set(propertyIds);
    const additions = [...selectedIds].filter(id => !previousIds.has(id));
    const removals = [...previousIds].filter(id => !selectedIds.has(id));

    try {
      for (const id of additions) {
        await PropertyApi.assignLandlord(Number(id), Number(landlordId));
      }
      for (const id of removals) {
        await PropertyApi.unassignLandlord(Number(id), Number(landlordId));
      }
      updateLandlord(Number(landlordId), { currentProperties: propertyIds.length });
      toast({ title: 'Properties Assigned', description: 'Company-scoped assignments saved successfully.' });
    } finally {
      // Refresh after success or a partial API failure; browser state is not authoritative.
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  };

  // Recipient groups for bulk email
  const bulkEmailRecipientGroups = [
    { id: 'landlords', label: 'All Landlords', icon: <Building2 className="h-4 w-4" />, count: landlords.length },
    { id: 'tenants', label: 'All Tenants', icon: <Users className="h-4 w-4" />, count: tenants.length },
    { id: 'employees', label: 'All Employees', icon: <Wrench className="h-4 w-4" />, count: 5 },
    { id: 'active_landlords', label: 'Active Landlords', icon: <CheckCircle className="h-4 w-4" />, count: activeLandlords },
  ];


  const handleRejectApproval = async () => {
  if (!selectedApproval || !rejectionReason.trim()) return;

  await reject(selectedApproval.id, rejectionReason);

  toast({
    title: "Approval Rejected",
    description: `Approval ${selectedApproval.id} rejected`,
  });

  setShowRejectDialog(false);
  setSelectedApproval(null);
  setRejectionReason("");
};


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not available';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'Not available';
    return parsed.toLocaleDateString('en-US', {
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
      <div className="space-y-5">
        {(propertyLoadError || unitsLoadError || billingLoadError) && (
          <div role="alert" className="rounded-lg border border-destructive/50 p-3 text-sm text-destructive">
            Platform totals are incomplete because some API requests failed.
            {propertyLoadError && <p>Properties: {propertyLoadError}</p>}
            {unitsLoadError && <p>Units: {unitsLoadError}</p>}
            {billingLoadError && <p>Billing: {billingLoadError}</p>}
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{activeTab === 'dashboard' ? 'Platform Overview' : 'Platform Administration'}</h1>
            <p className="text-muted-foreground text-sm">
              {activeTab === 'dashboard'
                ? 'Portfolio performance and activity across the platform'
                : 'Manage companies, people, access and platform settings'}
            </p>
          </div>
          <div className="flex items-center gap-2">


            <Button onClick={() => { setInviteStartRole('TENANT'); setShowInviteDialog(true); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>

            <Badge variant="outline" className="bg-primary/10 text-primary">
              <Shield className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          </div>
        </div>

        {/* Keep global KPIs on Overview only; each management tab owns its metrics. */}
        {activeTab === 'dashboard' && (
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
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="w-full overflow-x-auto pb-1" role="region" aria-label="Admin portal sections" tabIndex={0}>
           <TabsList className="flex h-auto min-h-11 w-max min-w-full items-center justify-start gap-1 p-1 lg:grid lg:w-full lg:min-w-[900px] lg:grid-cols-9">
            <TabsTrigger value="dashboard" className="flex min-h-11 shrink-0 items-center gap-2 px-3">
              <LayoutDashboard className="h-4 w-4" />
              <span className="inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="relative flex min-h-11 shrink-0 items-center gap-2 px-3">
              <UserCheck className="h-4 w-4" />
              <span className="inline">Approvals</span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex min-h-11 shrink-0 items-center gap-2 px-3">
              <Building2 className="h-4 w-4" />
              <span className="inline">Companies</span>
            </TabsTrigger>
            <TabsTrigger value="landlords" className="flex min-h-11 shrink-0 items-center gap-2 px-3">
              <Users className="h-4 w-4" />
              <span className="inline">Landlords</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex min-h-11 shrink-0 items-center gap-2 px-3">
              <Key className="h-4 w-4" />
              <span className="inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex min-h-11 shrink-0 items-center gap-2 px-3">
              <Mail className="h-4 w-4" />
              <span className="inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex min-h-11 shrink-0 items-center gap-2 px-3">
              <Lock className="h-4 w-4" />
              <span className="inline">System</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex min-h-11 shrink-0 items-center gap-2 px-3">
              <Shield className="h-4 w-4" />
              <span className="inline">Audit</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex min-h-11 shrink-0 items-center gap-2 px-3">
              <Settings className="h-4 w-4" />
              <span className="inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          </div>

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

                          <p className="font-medium">
  {landlord.firstName || landlord.lastName
    ? `${landlord.firstName ?? ""} ${landlord.lastName ?? ""}`.trim()
    : landlord.email}
</p>
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
                          <p className="font-medium">Expired Company Subscriptions</p>
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
            <TenantWorkflowApprovals />
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-xl font-semibold">Approvals</h2>
      <p className="text-muted-foreground">
        Review and approve system requests
      </p>
    </div>

    {pendingCount > 0 && (
      <Badge variant="destructive">
        {pendingCount} pending
      </Badge>
    )}
  </div>

  {approvals.filter(a => a.status === "PENDING" && !["TENANT", "LEASE", "DOCUMENT"].includes(a.type)).length > 0 ? (
    <Card>
      <div className="flex justify-end p-3"><ViewModeToggle value={viewMode} onChange={setViewMode} /></div>
              <ResponsiveTableView mode={viewMode}><Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {approvals
            .filter(a => a.status === "PENDING" && !["TENANT", "LEASE", "DOCUMENT"].includes(a.type))
            .map((approval) => (
              <TableRow key={approval.id}>
                <TableCell>
                  <Badge variant="secondary">
                    {approval.type}
                  </Badge>
                </TableCell>

                <TableCell>{approval.targetId}</TableCell>

                <TableCell>
                  {approval.propertyId ?? "—"}
                </TableCell>

                <TableCell>
                  {formatDate(approval.createdAt)}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label={`Actions for approval ${approval.id}`}>
                        <MoreHorizontal className="h-4 w-4"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={()=>{
                        setSelectedApproval(approval);
                        setShowApprovalDetails(true);
                      }}>View approval details</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive"
                        onSelect={()=>{
                          setSelectedApproval(approval);
                          setRejectionReason('');
                          setShowRejectDialog(true);
                        }}>Reject approval</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table></ResponsiveTableView>
    </Card>
  ) : (
    <Card>
      <CardContent className="text-center py-12">
        <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="font-medium">No Pending Approvals</p>
      </CardContent>
    </Card>
  )}
</TabsContent>

          {/* Company creation and management */}
          <TabsContent value="companies" className="space-y-4">
            <CompanyManagement />
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
                Invite Landlord
              </Button>
            </div>

            <Card>
              <div className="flex justify-end p-3"><ViewModeToggle value={viewMode} onChange={setViewMode} /></div>
              <ResponsiveTableView mode={viewMode}><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Company Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Company Plan Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLandlords.map((landlord) => (
                    <TableRow key={landlord.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {(landlord.firstName || landlord.email)
  .charAt(0)
  .toUpperCase()}
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
                        {landlord.subscriptionEndDate
  ? formatDate(landlord.subscriptionEndDate)
  : (
      <Badge variant="outline" className="text-muted-foreground">
        Not set
      </Badge>
    )
}
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
                            <DropdownMenuItem onClick={() => handleOpenAssignProperties(landlord)}>
                              <Building2 className="h-4 w-4 mr-2" />
                              Assign Properties
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActiveTab('companies')}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Manage Company Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></ResponsiveTableView>
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
                  <CardTitle>Company Subscription Plans</CardTitle>
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
                  <p className="text-xl font-bold">{selectedLandlord.currentProperties}/{selectedLandlord.maxProperties || "—"}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Units</p>
                  <p className="text-xl font-bold">{selectedLandlord.currentUnits}/{selectedLandlord.maxUnits || "—"}</p>
                </div>
              </div>

              {/* Assigned Properties */}
              {(() => {
                const assignedIds = getAssignedPropertyIds(selectedLandlord.id.toString());
                const assignedProps = properties.filter(p => assignedIds.includes(p.id));
                return assignedProps.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Assigned Properties</p>
                    <div className="space-y-1">
                      {assignedProps.map(p => (
                        <div key={p.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span>{p.name}</span>
                          <span className="text-muted-foreground">• {p.city}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">No properties assigned</p>
                  </div>
                );
              })()}

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
                  <span className="text-muted-foreground">Company Plan</span>
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
                  <span className="text-muted-foreground">Company Plan Expires</span>
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

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject Registration
            </DialogTitle>
           <DialogDescription>
  {selectedApproval && (
    <>
      Reject approval <strong>#{selectedApproval.id}</strong> ({selectedApproval.type})
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
                setSelectedApproval(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectApproval}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
             Reject Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Invite User Dialog */}
      <InviteUserDialog
  open={showInviteDialog}
  onOpenChange={setShowInviteDialog}
  inviterRole={user?.role || 'super_admin'}
  initialRole={inviteStartRole}
/>

<Dialog
  open={showApprovalDetails}
  onOpenChange={setShowApprovalDetails}
>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>
        Approval Details
      </DialogTitle>
      <DialogDescription>
        Review approval request and take action
      </DialogDescription>
    </DialogHeader>

    {selectedApproval && (
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium">{selectedApproval.type}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge variant="secondary">
              {selectedApproval.status}
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground">Target ID</p>
          <p className="font-medium">{selectedApproval.targetId}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Property</p>
          <p>{selectedApproval.propertyId ?? "—"}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Requested At</p>
          <p>{formatDate(selectedApproval.createdAt)}</p>
        </div>

        {/* Actions */}
        {selectedApproval.status === "PENDING" && (
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowApprovalDetails(false)}
            >
              Close
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                setShowApprovalDetails(false);
                setRejectionReason("");
                setShowRejectDialog(true);
              }}
            >
              Reject
            </Button>

            <Button
              onClick={async () => {
                await approve(selectedApproval.id);
                toast({
                  title: "Approval Approved",
                  description: `Approval ${selectedApproval.id} approved`,
                });
                setShowApprovalDetails(false);
                setSelectedApproval(null);
              }}
            >
              Approve
            </Button>
          </div>
        )}
      </div>
    )}
  </DialogContent>
</Dialog>

  {/* Assign Properties Dialog */}
      <AssignPropertiesDialog
        open={showAssignPropertiesDialog}
        onOpenChange={setShowAssignPropertiesDialog}
        landlord={assignPropertiesLandlord}
        properties={properties.filter(p => assignPropertiesLandlord?.companyId != null && p.companyId === assignPropertiesLandlord.companyId)}
        assignedPropertyIds={assignPropertiesLandlord ? getAssignedPropertyIds(assignPropertiesLandlord.id.toString()) : []}
        onSave={handleSavePropertyAssignment}
      />

    </DashboardLayout>
  );
}
