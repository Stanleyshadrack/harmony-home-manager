import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  FileText,
  CreditCard,
  Wrench,
  Plus,
  Home,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useUnits } from '@/hooks/useProperties';
import { useBilling } from '@/hooks/useBilling';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useApplications } from '@/hooks/useApplications';
import { useToast } from '@/hooks/use-toast';
import { UnitApplicationForm } from '@/components/portal/UnitApplicationForm';
import { AvailableUnitCard } from '@/components/portal/AvailableUnitCard';
import { ApplicationCard } from '@/components/portal/ApplicationCard';
import { TenantPaymentForm } from '@/components/portal/TenantPaymentForm';
import { InvoiceCard } from '@/components/billing/InvoiceCard';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { MaintenanceCard } from '@/components/maintenance/MaintenanceCard';
import { Unit } from '@/types/property';

// Mock current tenant data - would come from auth context in real app
const MOCK_TENANT = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@email.com',
  unitId: '1',
  unitNumber: 'A101',
  propertyName: 'Sunrise Apartments',
};

export default function TenantPortal() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { units } = useUnits();
  const { invoices, recordPayment } = useBilling();
  const { requests, createRequest } = useMaintenance();
  const { applications, submitApplication, withdrawApplication } = useApplications();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter data for current tenant
  const tenantInvoices = invoices.filter((inv) => inv.tenantId === MOCK_TENANT.id);
  const tenantRequests = requests.filter((req) => req.tenantId === MOCK_TENANT.id);
  const tenantApplications = applications.filter(
    (app) => app.applicantEmail === MOCK_TENANT.email
  );
  const vacantUnits = units.filter((u) => u.status === 'vacant');

  // Stats
  const totalOutstanding = tenantInvoices
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + inv.balance, 0);
  const pendingRequests = tenantRequests.filter(
    (req) => req.status !== 'resolved' && req.status !== 'cancelled'
  ).length;
  const pendingApplications = tenantApplications.filter(
    (app) => app.status === 'pending'
  ).length;

  const handleApplyForUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setShowApplicationForm(true);
  };

  const handleSubmitApplication = async (data: any) => {
    setIsLoading(true);
    try {
      const unit = units.find((u) => u.id === data.unitId);
      if (unit) {
        await submitApplication(data, unit.unitNumber, 'Property Name');
        toast({
          title: 'Application Submitted',
          description: 'Your application has been submitted for review.',
        });
        setShowApplicationForm(false);
        setSelectedUnit(null);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit application.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawApplication = async (id: string) => {
    try {
      await withdrawApplication(id);
      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been withdrawn.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to withdraw application.',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async (data: any) => {
    setIsLoading(true);
    try {
      recordPayment({
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionRef: data.reference || `PAY-${Date.now()}`,
        paymentDate: new Date().toISOString().split('T')[0],
      });
      toast({
        title: 'Payment Initiated',
        description: `Payment of $${data.amount.toFixed(2)} has been initiated.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to process payment.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      createRequest(data, MOCK_TENANT.id, MOCK_TENANT.name);
      toast({
        title: 'Request Submitted',
        description: 'Your maintenance request has been submitted.',
      });
      setShowMaintenanceForm(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit maintenance request.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Tenant Portal' }]}
      title="Tenant Portal"
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {MOCK_TENANT.name}</h1>
            <p className="text-muted-foreground">
              {MOCK_TENANT.unitNumber} • {MOCK_TENANT.propertyName}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Unit</p>
                <p className="font-semibold">{MOCK_TENANT.unitNumber}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full ${totalOutstanding > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
                <DollarSign className={`h-5 w-5 ${totalOutstanding > 0 ? 'text-destructive' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className={`font-semibold ${totalOutstanding > 0 ? 'text-destructive' : 'text-success'}`}>
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full ${pendingRequests > 0 ? 'bg-warning/10' : 'bg-muted'}`}>
                <Wrench className={`h-5 w-5 ${pendingRequests > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Requests</p>
                <p className="font-semibold">{pendingRequests}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full ${pendingApplications > 0 ? 'bg-info/10' : 'bg-muted'}`}>
                <FileText className={`h-5 w-5 ${pendingApplications > 0 ? 'text-info' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="font-semibold">{pendingApplications} pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Find Units</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Maintenance</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Invoices */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Invoices</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('invoices')}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tenantInvoices.slice(0, 3).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.balance)}</p>
                        <Badge
                          variant="outline"
                          className={
                            invoice.status === 'paid'
                              ? 'bg-success/10 text-success'
                              : invoice.status === 'overdue'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/10 text-warning'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {tenantInvoices.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No invoices yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Maintenance Requests */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Maintenance Requests</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('maintenance')}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tenantRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                    <div className="flex items-center gap-3">
                        {request.status === 'resolved' ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-warning" />
                        )}
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-muted-foreground">{request.category}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{request.status}</Badge>
                    </div>
                  ))}
                  {tenantRequests.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No requests yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Applications */}
            {tenantApplications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tenantApplications.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onWithdraw={handleWithdrawApplication}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Find Units Tab */}
          <TabsContent value="units" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Available Units</h2>
                <p className="text-muted-foreground">
                  {vacantUnits.length} units available for rent
                </p>
              </div>
              {tenantApplications.length > 0 && (
                <Badge variant="secondary">
                  {tenantApplications.filter((a) => a.status === 'pending').length} pending applications
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vacantUnits.map((unit) => (
                <AvailableUnitCard
                  key={unit.id}
                  unit={unit}
                  propertyName="Property"
                  onApply={handleApplyForUnit}
                />
              ))}
              {vacantUnits.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Vacant Units</p>
                    <p className="text-muted-foreground">Check back later for availability</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {tenantApplications.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Your Applications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenantApplications.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onWithdraw={handleWithdrawApplication}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your Invoices</h2>
                <p className="text-muted-foreground">
                  View and manage your billing history
                </p>
              </div>
              {totalOutstanding > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {formatCurrency(totalOutstanding)} outstanding
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenantInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
              {tenantInvoices.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Invoices</p>
                    <p className="text-muted-foreground">Your invoices will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Make a Payment</h2>
              <p className="text-muted-foreground">
                Pay your invoices securely online
              </p>
            </div>

            <div className="max-w-xl">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <TenantPaymentForm
                    invoices={tenantInvoices}
                    onSubmit={handlePayment}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Maintenance Requests</h2>
                <p className="text-muted-foreground">
                  Submit and track maintenance requests
                </p>
              </div>
              <Button onClick={() => setShowMaintenanceForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenantRequests.map((request) => (
                <MaintenanceCard key={request.id} request={request} />
              ))}
              {tenantRequests.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Requests</p>
                    <p className="text-muted-foreground mb-4">
                      You haven't submitted any maintenance requests yet
                    </p>
                    <Button onClick={() => setShowMaintenanceForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Request
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Application Form Dialog */}
      <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for Unit</DialogTitle>
          </DialogHeader>
          <UnitApplicationForm
            units={units}
            onSubmit={handleSubmitApplication}
            onCancel={() => setShowApplicationForm(false)}
            isLoading={isLoading}
            preselectedUnitId={selectedUnit?.id}
          />
        </DialogContent>
      </Dialog>

      {/* Maintenance Form Dialog */}
      <Dialog open={showMaintenanceForm} onOpenChange={setShowMaintenanceForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Maintenance Request</DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            onSubmit={handleMaintenanceSubmit}
            onCancel={() => setShowMaintenanceForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
