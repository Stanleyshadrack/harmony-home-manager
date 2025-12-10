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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Droplets, FileText, Filter } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';
import { BillingStats } from '@/components/billing/BillingStats';
import { InvoiceCard } from '@/components/billing/InvoiceCard';
import { PaymentCard } from '@/components/billing/PaymentCard';
import { InvoiceForm } from '@/components/billing/InvoiceForm';
import { PaymentForm } from '@/components/billing/PaymentForm';
import { WaterReadingForm } from '@/components/billing/WaterReadingForm';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceStatus } from '@/types/billing';

export default function Billing() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    invoices,
    payments,
    isLoading,
    createInvoice,
    createWaterInvoice,
    recordPayment,
    getTotalRevenue,
    getTotalOutstanding,
  } = useBilling();

  const [activeTab, setActiveTab] = useState('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showWaterForm, setShowWaterForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter((payment) => {
    return (
      payment.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionRef.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateInvoice = (data: any) => {
    createInvoice(data);
    setShowInvoiceForm(false);
    toast({
      title: 'Invoice Created',
      description: 'The invoice has been created successfully.',
    });
  };

  const handleRecordPayment = (data: any) => {
    recordPayment(data);
    setShowPaymentForm(false);
    setSelectedInvoice(undefined);
    toast({
      title: 'Payment Recorded',
      description: 'The payment has been recorded successfully.',
    });
  };

  const handleCreateWaterBill = (data: any) => {
    createWaterInvoice(data, 't1', 'John Doe', 'Sunrise Apartments', 'A101');
    setShowWaterForm(false);
    toast({
      title: 'Water Bill Generated',
      description: 'The water bill has been generated successfully.',
    });
  };

  const handleViewInvoice = (invoice: Invoice) => {
    // TODO: Implement invoice detail view
    console.log('View invoice:', invoice);
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
      <div className="space-y-6">
        {/* Stats */}
        <BillingStats
          invoices={invoices}
          totalRevenue={getTotalRevenue()}
          totalOutstanding={getTotalOutstanding()}
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
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="pending">{t('billing.pending')}</SelectItem>
                <SelectItem value="paid">{t('billing.paid')}</SelectItem>
                <SelectItem value="partial">{t('billing.partial')}</SelectItem>
                <SelectItem value="overdue">{t('billing.overdue')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
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
    </DashboardLayout>
  );
}
