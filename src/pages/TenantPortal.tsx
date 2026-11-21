import { TenantDepositStatement } from '@/components/billing/TenantDepositStatement';
import { TenantStatementPanel } from '@/components/billing/TenantStatementPanel';
import { TenantMoveInClearancePanel } from '@/components/tenants/TenantMoveInClearancePanel';
import { TenantDocumentCorrectionPanel } from '@/components/tenants/TenantDocumentCorrectionPanel';
import { TenantsApi } from '@/api/service/tenantsApi';
import { apiRequest } from '@/api/https';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
import { MaintenanceDetail } from '@/components/maintenance/MaintenanceDetail';
import { Unit } from '@/types/property';
import { useTenantAvailableUnits } from '@/hooks/useAvailableUnits';

export default function TenantPortal() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const tenantProfile = useQuery({
    queryKey: ['tenant-portal-profile'],
    queryFn: TenantsApi.getMe,
    retry: 1,
  });
  const currentTenant = tenantProfile.data;
  const tenantName = currentTenant
    ? [currentTenant.firstName, currentTenant.lastName].filter(Boolean).join(' ')
    : 'Tenant';
  const { invoices, isLoading: invoicesLoading, loadError: invoicesError, reload: reloadInvoices } = useBilling();
  const { requests, createRequest, addNote, tenantConfirmation, availableUnits, unitsLoadError, loadError: maintenanceError } = useMaintenance();
  const location = useLocation();
  const { applications, submitApplication, withdrawApplication } = useApplications();

  const [activeTab, setActiveTab] = useState(
    new URLSearchParams(location.search).get('tab') === 'maintenance' ? 'maintenance' : 'dashboard'
  );
  useEffect(() => {
    if (new URLSearchParams(location.search).get('tab') === 'maintenance') {
      setActiveTab('maintenance');
    }
  }, [location.search]);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceDetailId, setMaintenanceDetailId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{id: string; invoiceId: number} | null>(null);
  const [paymentNotice, setPaymentNotice] = useState('');
  const [selectedPayInvoiceId, setSelectedPayInvoiceId] = useState<number | null>(null);

  // /api/billing/invoice/my is already restricted to the authenticated tenant
  // by the backend. An empty/incomplete profile load must not hide valid invoices.
  const tenantInvoices = invoices;
  // The server already limits GET /api/maintenance to this authenticated tenant.
  const tenantRequests = requests;
  const selectedMaintenance = tenantRequests.find(item => item.id === maintenanceDetailId) ?? null;
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('request');
    if (id && tenantRequests.some(item => item.id === id)) {
      setActiveTab('maintenance');
      setMaintenanceDetailId(id);
    }
  }, [location.search, requests.length]);
  const tenantApplications = applications.filter(
    (app) => app.applicantEmail === currentTenant?.email
  );
  const {
  data: vacantUnits = [],
  isLoading: unitsLoading,
} = useTenantAvailableUnits();
  const units = vacantUnits;

  // Stats
  const totalOutstanding = tenantInvoices
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + inv.balance, 0);
  const pendingRequests = tenantRequests.filter(
    (req) => req.status !== 'confirmed' && req.status !== 'cancelled'
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

  const handlePayment = async (data: {invoiceId:string;amount:number;phoneNumber:string}) => {
    setIsLoading(true);
    try {
      const invoice = tenantInvoices.find(i => i.id === Number(data.invoiceId));
      if (!invoice) throw new Error('Invoice is not available in your account. Refresh the invoice list.');
      if (!Number.isFinite(data.amount) || data.amount <= 0 || data.amount > invoice.balance)
        throw new Error('Amount must be positive and no greater than the outstanding balance.');
      const params = new URLSearchParams({
        invoiceId: String(invoice.id),
        phone: data.phoneNumber.trim(),
        amount: String(data.amount),
      });
      const response = await apiRequest<null, {checkoutRequestId:string;status:string}>({
        path: `/api/billing/pay/mpesa?${params.toString()}`, method: 'POST',
      });
      if (!response.checkoutRequestId) throw new Error('The payment provider did not return a tracking ID.');
      setPendingCheckout({id: response.checkoutRequestId, invoiceId: invoice.id});
      setPaymentNotice('Payment request submitted. Check your phone and approve the M-Pesa prompt. Payment is not yet confirmed.');
      toast({
        title: 'M-Pesa confirmation requested',
        description: 'Check your phone. We will check the payment outcome; do not pay again while confirmation is pending.',
      });
    } catch (error) {
      toast({
        title: 'Unable to initiate payment',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check the server's persisted provider result, not a UI assumption.
  // Stop polling after 2 minutes; pending is never treated as paid.
  useEffect(() => {
    if (!pendingCheckout) return;
    let stopped = false;
    let attempts = 0;
    const timer = window.setInterval(() => {
      if (stopped) return;
      attempts += 1;
      void apiRequest<null, {status: string; method: string; amount?: number}>({
        path: `/api/billing/payment/status/${encodeURIComponent(pendingCheckout.id)}`,
        method: 'GET',
      }).then(async result => {
        if (stopped) return;
        if (result.status === 'success') {
          stopped = true;
          window.clearInterval(timer);
          await reloadInvoices().catch(() => {});
          setPaymentNotice('M-Pesa payment confirmed by the backend. The invoice list has been refreshed.');
          setPendingCheckout(null);
          toast({title: 'Payment confirmed', description: 'Your invoice payment has been recorded.'});
        } else if (result.status === 'failed') {
          stopped = true;
          window.clearInterval(timer);
          await reloadInvoices().catch(() => {});
          setPaymentNotice('M-Pesa payment was not completed. Check your M-Pesa messages before retrying.');
          setPendingCheckout(null);
          toast({title: 'Payment not completed', variant: 'destructive'});
        }
      }).catch(() => {
        // Intermittent polling failure must not invent a successful or failed payment.
      });
      if (attempts >= 24) {
        stopped = true;
        window.clearInterval(timer);
        setPaymentNotice('Confirmation is taking longer than expected. Refresh invoices or check your M-Pesa transaction history before retrying.');
        setPendingCheckout(null);
      }
    }, 5000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [pendingCheckout?.id, pendingCheckout?.invoiceId, reloadInvoices, toast]);

  const handleMaintenanceSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await createRequest(data);
      toast({
        title: 'Request Submitted',
        description: 'Your maintenance request has been submitted.',
      });
      setShowMaintenanceForm(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit maintenance request.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Tenant Portal' }]}
      title="Tenant Portal"
    >
      <div className="min-w-0 max-w-full space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {tenantName}</h1>
            <p className="text-muted-foreground">
              {(currentTenant?.unitNumber || 'Awaiting move-in')} • {(currentTenant?.propertyName || 'Property not yet assigned')}
            </p>
          </div>
        </div>

        {tenantProfile.isLoading && (
          <p className="text-sm text-muted-foreground" role="status">Loading your tenant profile…</p>
        )}
        {tenantProfile.isError && (
          <p className="rounded-md border border-destructive/30 p-3 text-sm text-destructive" role="alert">
            Your tenant profile could not be loaded. Please refresh or contact the landlord.
          </p>
        )}
        <TenantMoveInClearancePanel tenantView />
        {currentTenant && (
          <TenantDocumentCorrectionPanel
            idStatus={currentTenant.idDocumentStatus}
            leaseStatus={currentTenant.leaseDocumentStatus}
          />
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Unit</p>
                <p className="font-semibold">{currentTenant?.unitNumber || 'Awaiting move-in'}</p>
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
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
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
            <TabsTrigger value="statement" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Statement</span>
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
                  {!invoicesLoading && !invoicesError && tenantInvoices.length === 0 && (
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
                        {request.status === 'confirmed' ? (
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
  {unitsLoading
    ? "Loading available units..."
    : `${vacantUnits.length} units available for rent`}
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

          <TabsContent value="statement" className="space-y-4">
            <TenantStatementPanel tenantId={currentTenant?.id} />
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

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={invoicesLoading}
                onClick={() => { void reloadInvoices().catch(() => {}); }}>
                {invoicesLoading ? 'Refreshing…' : 'Refresh invoices'}
              </Button>
              {tenantInvoices.some(invoice => invoice.balance > 0 && invoice.status !== 'cancelled') &&
                <Button size="sm" onClick={() => setActiveTab('payments')}>Pay outstanding invoice</Button>}
            </div>
            {invoicesError && <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
              Unable to load invoices: {invoicesError}. Please refresh or contact the landlord.
            </p>}
            {invoicesLoading && <p role="status" className="text-sm text-muted-foreground">Loading invoices…</p>}
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              {tenantInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice}
                  paymentActionLabel="Pay with M-Pesa"
                  onRecordPayment={(selected) => {
                    setSelectedPayInvoiceId(selected.id);
                    setActiveTab('payments');
                  }} />
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

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" disabled={invoicesLoading}
                onClick={() => { void reloadInvoices().catch(() => {}); }}>
                {invoicesLoading ? 'Refreshing…' : 'Refresh payment balances'}
              </Button>
              {pendingCheckout && <Badge variant="outline">Waiting for M-Pesa confirmation</Badge>}
            </div>
            {paymentNotice && <p role="status" className="rounded-md border p-3 text-sm">{paymentNotice}</p>}
            {invoicesError && <p role="alert" className="text-sm text-destructive">
              Unable to load payable invoices: {invoicesError}
            </p>}
            <div className="max-w-xl">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <TenantPaymentForm
                    invoices={tenantInvoices}
                    selectedInvoiceId={selectedPayInvoiceId}
                    onSubmit={handlePayment}
                    isLoading={isLoading || invoicesLoading || !!pendingCheckout}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            {maintenanceError && <p role="alert" className="text-sm text-destructive">
              Maintenance requests could not be loaded: {maintenanceError}
            </p>}
            {unitsLoadError && <p role="alert" className="text-sm text-destructive">
              Occupied units could not be loaded: {unitsLoadError}
            </p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
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

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              {tenantRequests.map((request) => (
                <MaintenanceCard key={request.id} request={request}
                  onView={() => setMaintenanceDetailId(request.id)} />
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

      <Dialog open={maintenanceDetailId !== null}
        onOpenChange={open => { if (!open) setMaintenanceDetailId(null); }}>
        <DialogContent className="grid h-[min(90dvh,820px)] w-[calc(100vw-2rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden p-4 sm:p-6">
          <DialogHeader className="shrink-0 pr-8 text-left"><DialogTitle>Maintenance request details</DialogTitle></DialogHeader>
          {selectedMaintenance && (
            <div className="min-h-0 overflow-y-auto overscroll-contain pr-1 pb-5 sm:pr-2">
            <MaintenanceDetail request={selectedMaintenance}
              onTenantDecision={async (accepted, reason) => {
                await tenantConfirmation(selectedMaintenance.id, accepted, reason);
                toast({
                  title: accepted ? 'Repair confirmed' : 'Issue reopened',
                  description: accepted
                    ? 'The maintenance request is now closed.'
                    : 'The employee and landlord will be informed.',
                });
              }}
              onClose={() => setMaintenanceDetailId(null)}
              onAddNote={async content => {
                await addNote(selectedMaintenance.id, content);
              }} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Maintenance Form Dialog */}
      <Dialog open={showMaintenanceForm} onOpenChange={setShowMaintenanceForm}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Submit Maintenance Request</DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            units={availableUnits}
            onSubmit={handleMaintenanceSubmit}
            onCancel={() => setShowMaintenanceForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
