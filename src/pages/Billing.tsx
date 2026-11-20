import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Droplets, FileText, Filter, Download, CheckCircle, Mail, Loader2, Edit, MoreHorizontal, CreditCard, Settings, LayoutDashboard, ArrowRight, AlertCircle } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/contexts/AuthContext';
import { BillingAutomationPanel } from '@/components/billing/BillingAutomationPanel';
import { InvoiceDispatchPanel } from '@/components/billing/InvoiceDispatchPanel';
import { DepositManagementPanel } from '@/components/billing/DepositManagementPanel';
import { InvoicePaymentSettingsPanel } from '@/components/billing/InvoicePaymentSettingsPanel';
import { BillingStats } from '@/components/billing/BillingStats';
import { InvoiceCard } from '@/components/billing/InvoiceCard';
import { InvoiceDetail } from '@/components/billing/InvoiceDetail';
import { PaymentCard } from '@/components/billing/PaymentCard';
import { InvoiceForm } from '@/components/billing/InvoiceForm';
import { PaymentForm } from '@/components/billing/PaymentForm';
import { WaterReadingForm } from '@/components/billing/WaterReadingForm';
import { useToast } from '@/hooks/use-toast';
import { downloadPaymentReceiptPDF } from '@/utils/paymentReceiptPdf';
import { sendPaymentReceiptEmail } from '@/services/emailService';
import type { Invoice, InvoiceStatus, Payment } from '@/types/billing';

export default function Billing() {
  const [viewMode, setViewMode] = useViewMode('billing');
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const canManageBilling = user?.role === 'landlord' || user?.role === 'super_admin';
  const {
    invoices,
    payments,
    isLoading,
    loadError,
    reload,
    createInvoice,
    createWaterInvoice,
    recordPayment,
    updateInvoice,
    cancelInvoice,
    getTotalRevenue,
    getTotalOutstanding,
  } = useBilling();


  const [activeTab, setActiveTab] = useState('overview');
  const [showInvoiceActions, setShowInvoiceActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showWaterForm, setShowWaterForm] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [lastPayment, setLastPayment] = useState<{ payment: Payment; invoice: Invoice } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unpaidInvoices = invoices.filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.balance > 0);
  const undeliveredCount = invoices.filter(invoice => invoice.status === 'pending' && invoice.balance > 0).length;

  const filteredPayments = payments.filter((payment) => {
    return (
      payment.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionRef.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateInvoice = async (data: any) => {
    try {
      await createInvoice(data);
      setShowInvoiceForm(false);
      toast({ title: 'Invoice Created', description: 'The invoice was saved to PostgreSQL.' });
    } catch (error) {
      toast({ title: 'Invoice Failed', description: error instanceof Error ? error.message : 'Unable to create invoice', variant: 'destructive' });
    }
  };

  const handleUpdateInvoice = async (data: any) => {
    if (!editingInvoice) return;
    try {
      await updateInvoice(editingInvoice.id, data);
      setEditingInvoice(null);
      toast({ title: 'Invoice Updated', description: 'Changes saved successfully.' });
    } catch (error) {
      toast({ title: 'Update Failed', description: error instanceof Error ? error.message : 'Unable to update invoice', variant: 'destructive' });
    }
  };

  const handleCancelInvoice = async (invoice: Invoice, reason: string) => {
    try {
      await cancelInvoice(invoice.id, reason);
      setViewingInvoice(null);
      toast({ title: 'Invoice Cancelled', description: 'The invoice was cancelled in PostgreSQL.' });
    } catch (error) {
      toast({ title: 'Cancellation Failed', description: error instanceof Error ? error.message : 'Unable to cancel invoice', variant: 'destructive' });
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setViewingInvoice(null);
    setEditingInvoice(invoice);
  };

  const handleRecordPayment = async (data: any) => {
    try {
      const invoice = selectedInvoice;
      const payment = await recordPayment(data);
      setShowPaymentForm(false);
      setSelectedInvoice(undefined);
      if (invoice) {
        setLastPayment({ payment, invoice });
        setShowReceiptDialog(true);
      }
      toast({ title: 'Payment Recorded', description: 'Payment saved to PostgreSQL.' });
    } catch (error) {
      toast({ title: 'Payment Failed', description: error instanceof Error ? error.message : 'Unable to record payment', variant: 'destructive' });
    }
  };

  const handleDownloadReceipt = () => {
    if (!lastPayment) return;
    downloadPaymentReceiptPDF({
      payment: lastPayment.payment,
      invoice: lastPayment.invoice,
      propertyName: lastPayment.invoice.propertyName,
      propertyAddress: lastPayment.invoice.propertyName,
      landlordName: lastPayment.invoice.propertyName,
      landlordPhone: '',
      landlordEmail: '',
    });
    toast({ title: 'Receipt Downloaded', description: 'Receipt generated from a recorded payment.' });
  };

  const handleSendReceiptEmail = async () => {
    if (!lastPayment) return;
    const email = lastPayment.invoice.tenantEmail;
    if (!email) {
      toast({ title: 'Tenant Email Missing', description: 'Cannot send a receipt without a verified tenant email.', variant: 'destructive' });
      return;
    }
    setIsSendingEmail(true);
    try {
      await sendPaymentReceiptEmail({
        payment: lastPayment.payment,
        invoice: lastPayment.invoice,
        recipient: { name: lastPayment.payment.tenantName, email },
        propertyName: lastPayment.invoice.propertyName,
        landlordName: lastPayment.invoice.propertyName,
      });
      toast({ title: 'Email Sent', description: `Receipt sent to ${email}.` });
    } catch (error) {
      toast({ title: 'Email Failed', description: 'Could not send receipt email.', variant: 'destructive' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCreateWaterBill = async (data: any) => {
    try {
      await createWaterInvoice(data);
      setShowWaterForm(false);
      toast({ title: 'Water Reading Saved', description: 'An approved reading will be included in the relevant billing cycle.' });
    } catch (error) {
      toast({ title: 'Reading Failed', description: error instanceof Error ? error.message : 'Unable to save reading', variant: 'destructive' });
    }
  };


  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
  };

  const handleRecordPaymentFromDetail = (invoice: Invoice) => {
    setViewingInvoice(null);
    setSelectedInvoice(invoice);
    setShowPaymentForm(true);
  };

  const handleRecordPaymentClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentForm(true);
  };

  return (
    <DashboardLayout
      title={t('billing.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('billing.title') },
      ]}
    >
      <div className="min-w-0 space-y-6">
        {loadError && <div role="alert" className="rounded-lg border border-destructive/50 p-3 text-sm text-destructive">
          Billing data could not be loaded: {loadError}
        </div>}
        {/* Stats */}
        <BillingStats
          invoices={invoices}
          totalRevenue={getTotalRevenue()}
          totalOutstanding={getTotalOutstanding()}
        />

        {/* One primary billing action; operational search belongs to the relevant tab. */}
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Billing workspace</h2>
            <p className="text-sm text-muted-foreground">
              Review water, reconcile charges, issue monthly invoices, then monitor tenant payments.
            </p>
          </div>
          {canManageBilling && (
            <Button onClick={() => setActiveTab('monthly')} className="shrink-0">
              <FileText className="mr-2 h-4 w-4" />Run Monthly Billing
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="h-4 w-4"/>Overview</TabsTrigger>
            {canManageBilling && <TabsTrigger value="monthly" className="gap-2"><FileText className="h-4 w-4"/>Monthly Billing</TabsTrigger>}
            <TabsTrigger value="invoices" className="gap-2"><FileText className="h-4 w-4"/>{t('billing.invoices')} ({invoices.length})</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2"><CreditCard className="h-4 w-4"/>{t('billing.payments')} ({payments.length})</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            {canManageBilling && <TabsTrigger value="payment-settings" className="gap-2"><Settings className="h-4 w-4"/>Settings</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding balance</p><p className="mt-1 text-xl font-semibold">KES {getTotalOutstanding().toLocaleString('en-KE')}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Unpaid invoices</p><p className="mt-1 text-xl font-semibold">{unpaidInvoices.length}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending invoice balances</p><p className="mt-1 text-xl font-semibold">{undeliveredCount}</p><p className="text-xs text-muted-foreground">Not a delivery-status count</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Recorded payments</p><p className="mt-1 text-xl font-semibold">{payments.length}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly billing checklist</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>1. Record and approve water readings for the preceding month.</p>
                <p>2. Review balances and unresolved billing warnings.</p>
                <p>3. Preview and confirm the consolidated monthly invoices.</p>
                <p>4. Issued invoices are made available in the tenant portal; app and email notices are attempted after posting.</p>
                <p>5. Review unpaid invoices, payments and delivery logs.</p>
                {canManageBilling && <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => setActiveTab('monthly')}>Start monthly billing <ArrowRight className="ml-2 h-4 w-4"/></Button>
                  <Button variant="outline" onClick={() => setShowWaterForm(true)}><Droplets className="mr-2 h-4 w-4"/>Record water reading</Button>
                </div>}
              </CardContent>
            </Card>
            {loadError && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4"/>{loadError}</p>}
          </TabsContent>

          {canManageBilling && <TabsContent value="monthly" className="mt-6 space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="font-semibold">Monthly Billing · Review → Preview → Issue</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Approve preceding-month water first. The backend blocks issuance when relevant water readings are pending.
                Current-month rent and previously approved unbilled water are combined without duplicating old arrears.
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowWaterForm(true)}>
                <Droplets className="mr-2 h-4 w-4"/>Record missing water reading
              </Button>
            </div>
            <BillingAutomationPanel onIssued={reload}/>
            <p className="text-xs text-muted-foreground">
              After issue, tenants can view invoices in their portal. For exceptional resends, open Invoices.
            </p>
          </TabsContent>}

          {(activeTab === 'invoices' || activeTab === 'payments') && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  <Input className="pl-9" placeholder="Search invoices or payments"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
                </div>
                {activeTab === 'invoices' && <Select value={statusFilter} onValueChange={value=>setStatusFilter(value as InvoiceStatus | 'all')}>
                  <SelectTrigger className="w-[155px]"><Filter className="mr-2 h-4 w-4"/><SelectValue placeholder="Status"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>}
              </div>
              <div className="flex items-center gap-2">
                <ViewModeToggle value={viewMode} onChange={setViewMode}/>
                {activeTab === 'invoices' && canManageBilling && (
                  <div className="relative">
                    <Button variant="outline" aria-expanded={showInvoiceActions}
                      onClick={() => setShowInvoiceActions(open => !open)}>
                      <MoreHorizontal className="mr-2 h-4 w-4"/>More actions
                    </Button>
                    {showInvoiceActions && <div className="absolute right-0 z-20 mt-1 min-w-52 rounded-md border bg-popover p-1 shadow-lg">
                      <button className="w-full rounded px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={()=>{setShowInvoiceForm(true);setShowInvoiceActions(false);}}>
                        Create special invoice
                      </button>
                    </div>}
                  </div>
                )}
              </div>
            </div>
          )}
          <TabsContent value="invoices" className="mt-6">
            <InvoiceDispatchPanel invoices={filteredInvoices} />
            {filteredInvoices.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Use Monthly Billing to generate regular rent and water invoices.'}
                  </p>
                  {canManageBilling && <Button onClick={() => setActiveTab('monthly')}>
                    Open Monthly Billing <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>}
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-3"}>
                {filteredInvoices.map((invoice) => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onView={handleViewInvoice}
                    onRecordPayment={handleRecordPaymentClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deposits" className="mt-6">
            <DepositManagementPanel/>
          </TabsContent>
          <TabsContent value="payment-settings" className="mt-6">
            <InvoicePaymentSettingsPanel/>
          </TabsContent>
          <TabsContent value="payments" className="mt-6">
            {filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No payments recorded</h3>
                  <p className="text-muted-foreground max-w-md">
                    Payments will appear here once they are recorded against invoices.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-3"}>
                {filteredPayments.map((payment) => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('billing.createInvoice')}</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            onSubmit={handleCreateInvoice}
            onCancel={() => setShowInvoiceForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={!!editingInvoice} onOpenChange={(open) => !open && setEditingInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Invoice {editingInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {editingInvoice && (
            <InvoiceForm
              onSubmit={handleUpdateInvoice}
              onCancel={() => setEditingInvoice(null)}
              isLoading={isLoading}
              isEditing
              initialData={{
                tenantId: editingInvoice.tenantId,
                unitId: editingInvoice.unitId,
                type: editingInvoice.type,
                description: editingInvoice.description,
                amount: editingInvoice.amount,
                dueDate: editingInvoice.dueDate,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <PaymentForm
            invoice={selectedInvoice}
            onSubmit={handleRecordPayment}
            onCancel={() => {
              setShowPaymentForm(false);
              setSelectedInvoice(undefined);
            }}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Water Reading Dialog */}
      <Dialog open={showWaterForm} onOpenChange={setShowWaterForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Water Reading</DialogTitle>
          </DialogHeader>
          <WaterReadingForm
            onSubmit={handleCreateWaterBill}
            onCancel={() => setShowWaterForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Payment Success & Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center py-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl">Payment Successful!</DialogTitle>
              <DialogDescription className="mt-2">
                {lastPayment && (
                  <>
                    Payment of <span className="font-semibold">KES {lastPayment.payment.amount.toLocaleString()}</span> has been recorded for invoice <span className="font-semibold">{lastPayment.invoice.invoiceNumber}</span>.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-6 w-full">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleDownloadReceipt}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleSendReceiptEmail}
                  disabled={isSendingEmail}
                >
                  {isSendingEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Email Tenant
                </Button>
              </div>
              <Button
                className="w-full"
                onClick={() => setShowReceiptDialog(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <InvoiceDetail
        invoice={viewingInvoice}
        payments={payments}
        open={!!viewingInvoice}
        onOpenChange={(open) => !open && setViewingInvoice(null)}
        onRecordPayment={handleRecordPaymentFromDetail}
        onEdit={handleEditInvoice}
        onCancel={handleCancelInvoice}
      />
    </DashboardLayout>
  );
}
