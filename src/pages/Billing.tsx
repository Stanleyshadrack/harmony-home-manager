import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpdateInvoice, useCancelInvoice } from '@/hooks/useBilling';
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
import { Plus, Search, Droplets, FileText, Filter, Zap, Download, CheckCircle, Mail, Loader2, Edit } from 'lucide-react';
import { logAuditEvent } from '@/services/auditService';
import {
  useMyInvoices,
  useCreateInvoice,
  useRecordPayment,
} from '@/hooks/useBilling';
import { useAutoInvoice } from '@/hooks/useAutoInvoice';
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
import { createWaterInvoice } from '@/api/service/billing.service';

export default function Billing() {
  const { t } = useTranslation();
  const { toast } = useToast();
 const { data: invoices = [], isLoading } = useMyInvoices();
 const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
 const { mutateAsync: updateInvoiceMutate } = useUpdateInvoice();
const { mutateAsync: cancelInvoiceMutate } = useCancelInvoice();
 const payments = useMemo(
  () => invoices.flatMap(inv => inv.payments ?? []),
  [invoices]
);
const { mutate: createInvoice } = useCreateInvoice();
const { mutate: recordPayment } = useRecordPayment();

  const { generateMonthlyRentInvoices, getTenantsWithoutInvoice, generateInvoicesForTenant  } = useAutoInvoice();
  const tenantsWithoutInvoice = getTenantsWithoutInvoice();

  const [activeTab, setActiveTab] = useState('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showWaterForm, setShowWaterForm] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [lastPayment, setLastPayment] = useState<{ payment: Payment; invoice: Invoice } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

 const filteredInvoices = invoices.filter((invoice) => {
  const matchesSearch =
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.tenantName.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesStatus =
    statusFilter === 'all' || invoice.status === statusFilter;

  return matchesSearch && matchesStatus;
});

 const filteredPayments = payments.filter((payment) => {
  return (
    payment.transactionRef?.toLowerCase().includes(searchQuery.toLowerCase())
  );
});

  const handleCreateInvoice = async (data: any) => {
  const invoice = await generateInvoicesForTenant(String(data.tenantId));

  if (!invoice) return;

  logAuditEvent(
    'user1',
    'Current User',
    'landlord',
    'create_invoice',
    'Invoice',
    `Created invoice ${invoice.invoiceNumber}`,
    invoice.id.toString()
  );

  setShowInvoiceForm(false);

  toast({
    title: 'Invoice Created',
    description: 'The invoice has been created successfully.',
  });
};

 const handleUpdateInvoice = async (data: any) => {
  if (!editingInvoice) return;

  const current = editingInvoice;
  setEditingInvoice(null);

  try {
    await updateInvoiceMutate({
      id: current.id,
      payload: data,
    });

    logAuditEvent(
      'user1',
      'Current User',
      'landlord',
      'update_invoice',
      'Invoice',
      `Updated invoice ${current.invoiceNumber}`,
      current.id.toString(),
      {
        previousAmount: current.amount,
        newAmount: data.amount,
      }
    );

    toast({
      title: 'Invoice Updated',
      description: 'The invoice has been updated successfully.',
    });
  } catch (error: any) {
    toast({
      title: 'Update failed',
      description: error.message || 'Something went wrong',
      variant: 'destructive',
    });
  }
};

 const handleCancelInvoice = async (
  invoice: Invoice,
  reason?: string
) => {
  setViewingInvoice(null);

  try {
    await cancelInvoiceMutate(invoice.id);

    logAuditEvent(
      'user1',
      'Current User',
      'landlord',
      'cancel_invoice',
      'Invoice',
      `Cancelled invoice ${invoice.invoiceNumber}. Reason: ${reason || 'No reason provided'}`,
      invoice.id.toString(),
      { cancellationReason: reason }
    );

    toast({
      title: 'Invoice Cancelled',
      description: `Invoice ${invoice.invoiceNumber} has been cancelled.`,
    });
  } catch (error: any) {
    toast({
      title: 'Cancel failed',
      description: error.message || 'Something went wrong',
      variant: 'destructive',
    });
  }
};

  const handleEditInvoice = (invoice: Invoice) => {
    setViewingInvoice(null);
    setEditingInvoice(invoice);
  };

  const handleRecordPayment = async (data: any) => {
    const payment = await recordPayment(data);
    const invoice = selectedInvoice;
    setShowPaymentForm(false);
    setSelectedInvoice(undefined);
    
    if (invoice && payment) {
      setLastPayment({ payment, invoice });
      setShowReceiptDialog(true);
    }
    
    toast({
      title: 'Payment Recorded',
      description: 'The payment has been recorded successfully.',
    });
  };

  const handleDownloadReceipt = () => {
    if (!lastPayment) return;
    
    downloadPaymentReceiptPDF({
      payment: lastPayment.payment,
      invoice: lastPayment.invoice,
      propertyName: lastPayment.invoice.propertyName,
      propertyAddress: '123 Main Street, Nairobi', // Mock address
      landlordName: 'Property Management Co.',
      landlordPhone: '+254 700 123 456',
      landlordEmail: 'billing@property.co.ke',
    });
    
    toast({
      title: 'Receipt Downloaded',
      description: 'Your payment receipt has been downloaded.',
    });
  };

  const handleSendReceiptEmail = async () => {
    if (!lastPayment) return;
    
    setIsSendingEmail(true);
    try {
      await sendPaymentReceiptEmail({
        payment: lastPayment.payment,
        invoice: lastPayment.invoice,
        recipient: {
          name: lastPayment.invoice.tenantName,
          email: `${lastPayment.invoice.tenantName.toLowerCase().replace(' ', '.')}@email.com`,
        },
        propertyName: lastPayment.invoice.propertyName,
        landlordName: 'Property Management Co.',
      });
      
      toast({
        title: 'Email Sent',
        description: `Receipt emailed to ${lastPayment.invoice.tenantName}.`,
      });
    } catch (error) {
      toast({
        title: 'Email Failed',
        description: 'Could not send receipt email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCreateWaterBill = async (data: any) => {
    await createWaterInvoice(data);
    setShowWaterForm(false);
    toast({
      title: 'Water Bill Generated',
      description: 'The water bill has been generated successfully.',
    });
  };

  const handleAutoGenerateInvoices = async () => {
    const { generated, skipped } = await generateMonthlyRentInvoices();
    toast({
      title: 'Auto-Generate Complete',
      description: `Generated ${generated} invoice(s). Skipped ${skipped} (already billed or no active lease).`,
    });
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

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

const totalOutstanding = invoices.reduce(
  (sum, inv) => sum + inv.balance,
  0
);


  return (
    <DashboardLayout
      title={t('billing.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('billing.title') },
      ]}
    >
      <div className="space-y-6">
        {/* Stats */}
        <BillingStats
  invoices={invoices}
  totalRevenue={totalRevenue}
  totalOutstanding={totalOutstanding}
/>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'all')}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('common.filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
<SelectItem value="PAID">Paid</SelectItem>
<SelectItem value="PARTIAL">Partial</SelectItem>
<SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="secondary" 
              onClick={handleAutoGenerateInvoices}
              disabled={tenantsWithoutInvoice.length === 0}
            >
              <Zap className="h-4 w-4 mr-2" />
              Auto-Generate ({tenantsWithoutInvoice.length})
            </Button>
            <Button variant="outline" onClick={() => setShowWaterForm(true)}>
              <Droplets className="h-4 w-4 mr-2" />
              Water Reading
            </Button>
            <Button onClick={() => setShowInvoiceForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('billing.createInvoice')}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              {t('billing.invoices')} ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <FileText className="h-4 w-4" />
              {t('billing.payments')} ({payments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-6">
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
                      : 'Create your first invoice to get started.'}
                  </p>
                  <Button onClick={() => setShowInvoiceForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('billing.createInvoice')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                tenantId: String(editingInvoice.tenantId), // ✅ FIX
                unitId: String(editingInvoice.unitId), 
                type: editingInvoice.type,
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
