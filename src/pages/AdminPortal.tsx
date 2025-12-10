import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { useTenants } from '@/hooks/useTenants';
import { useBilling } from '@/hooks/useBilling';
import { getAuditLogs, getActivitySummary } from '@/services/auditService';
import { useToast } from '@/hooks/use-toast';

// Mock landlords data
const mockLandlords = [
  {
    id: '1',
    name: 'Alice Wanjiku',
    email: 'alice@landlord.com',
    phone: '+254 712 345 678',
    properties: 5,
    units: 42,
    status: 'active',
    joinedAt: '2023-06-15',
    subscription: 'premium',
  },
  {
    id: '2',
    name: 'Bob Ochieng',
    email: 'bob@landlord.com',
    phone: '+254 723 456 789',
    properties: 3,
    units: 24,
    status: 'active',
    joinedAt: '2023-09-20',
    subscription: 'basic',
  },
  {
    id: '3',
    name: 'Carol Muthoni',
    email: 'carol@landlord.com',
    phone: '+254 734 567 890',
    properties: 8,
    units: 96,
    status: 'suspended',
    joinedAt: '2023-03-10',
    subscription: 'enterprise',
  },
];

export default function AdminPortal() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { properties } = useProperties();
  const { tenants } = useTenants();
  const { invoices, payments } = useBilling();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLandlord, setSelectedLandlord] = useState<typeof mockLandlords[0] | null>(null);
  const [showLandlordDialog, setShowLandlordDialog] = useState(false);

  const auditLogs = getAuditLogs();
  const activitySummary = getActivitySummary();

  // Platform Stats
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalLandlords = mockLandlords.length;
  const activeLandlords = mockLandlords.filter((l) => l.status === 'active').length;
  const totalProperties = properties.length;
  const totalUnits = mockLandlords.reduce((sum, l) => sum + l.units, 0);

  const filteredLandlords = mockLandlords.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewLandlord = (landlord: typeof mockLandlords[0]) => {
    setSelectedLandlord(landlord);
    setShowLandlordDialog(true);
  };

  const handleSuspendLandlord = (id: string) => {
    toast({
      title: 'Landlord Suspended',
      description: 'The landlord account has been suspended.',
    });
  };

  const handleActivateLandlord = (id: string) => {
    toast({
      title: 'Landlord Activated',
      description: 'The landlord account has been activated.',
    });
  };

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
              Manage landlords, monitor platform activity, and configure system settings
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="landlords" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Landlords</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Audit Logs</span>
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
                  {mockLandlords.slice(0, 5).map((landlord) => (
                    <div
                      key={landlord.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {landlord.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{landlord.name}</p>
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
                          {landlord.properties} properties
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
                    {mockLandlords.filter((l) => l.status === 'suspended').length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <Ban className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="font-medium">Suspended Accounts</p>
                          <p className="text-sm text-muted-foreground">
                            {mockLandlords.filter((l) => l.status === 'suspended').length} landlord account(s) are currently suspended
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
              <Button>
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
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLandlords.map((landlord) => (
                    <TableRow key={landlord.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {landlord.name.charAt(0)}
                          </div>
                          <span className="font-medium">{landlord.name}</span>
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
                          <p>{landlord.properties} properties</p>
                          <p className="text-muted-foreground">{landlord.units} units</p>
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
                      <TableCell className="text-muted-foreground">
                        {formatDate(landlord.joinedAt)}
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
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">System email alerts</p>
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
                  <CardDescription>Manage available subscription tiers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Basic Plan</p>
                      <p className="text-sm text-muted-foreground">Up to 10 units</p>
                    </div>
                    <span className="font-semibold">$29/mo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Premium Plan</p>
                      <p className="text-sm text-muted-foreground">Up to 50 units</p>
                    </div>
                    <span className="font-semibold">$79/mo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Enterprise Plan</p>
                      <p className="text-sm text-muted-foreground">Unlimited units</p>
                    </div>
                    <span className="font-semibold">$199/mo</span>
                  </div>
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
                  {selectedLandlord.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedLandlord.name}</h3>
                  <p className="text-muted-foreground">{selectedLandlord.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Properties</p>
                  <p className="text-xl font-bold">{selectedLandlord.properties}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Units</p>
                  <p className="text-xl font-bold">{selectedLandlord.units}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{selectedLandlord.phone}</span>
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
                  <span>{formatDate(selectedLandlord.joinedAt)}</span>
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
    </DashboardLayout>
  );
}
