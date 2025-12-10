import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  CreditCard, 
  Home, 
  Droplets, 
  FileText, 
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  XCircle,
} from 'lucide-react';
import type { Invoice, Payment } from '@/types/billing';
import { downloadInvoicePDF } from '@/utils/invoicePdf';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface InvoiceDetailProps {
  invoice: Invoice | null;
  payments?: Payment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
  onCancel?: (invoice: Invoice, reason: string) => void;
}

const statusColors: Record<Invoice['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  partial: 'bg-info/10 text-info border-info/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground',
};

const statusIcons: Record<Invoice['status'], React.ReactNode> = {
  draft: <FileText className="h-4 w-4" />,
  pending: <Clock className="h-4 w-4" />,
  paid: <CheckCircle className="h-4 w-4" />,
  partial: <AlertTriangle className="h-4 w-4" />,
  overdue: <AlertTriangle className="h-4 w-4" />,
  cancelled: <FileText className="h-4 w-4" />,
};

const typeIcons: Record<Invoice['type'], React.ReactNode> = {
  rent: <Home className="h-5 w-5" />,
  water: <Droplets className="h-5 w-5" />,
  utilities: <FileText className="h-5 w-5" />,
  late_fee: <FileText className="h-5 w-5" />,
  other: <FileText className="h-5 w-5" />,
};

const typeLabels: Record<Invoice['type'], string> = {
  rent: 'Rent',
  water: 'Water Bill',
  utilities: 'Utilities',
  late_fee: 'Late Fee',
  other: 'Other',
};

export function InvoiceDetail({ 
  invoice, 
  payments = [], 
  open, 
  onOpenChange,
  onRecordPayment,
  onEdit,
  onCancel
}: InvoiceDetailProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [cancelReason, setCancelReason] = useState('');

  if (!invoice) return null;

  const canEdit = invoice.status !== 'paid' && invoice.status !== 'cancelled';
  const canCancel = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownloadPDF = () => {
    downloadInvoicePDF({
      invoice,
      tenantName: invoice.tenantName,
      tenantEmail: 'tenant@email.com',
      unitNumber: invoice.unitNumber,
      propertyName: invoice.propertyName,
      propertyAddress: '123 Property Street, Nairobi',
      landlordName: 'Property Manager',
      landlordPhone: '+254 712 345 678',
      landlordEmail: 'manager@property.com',
    });
    toast({
      title: 'Invoice Downloaded',
      description: `Invoice ${invoice.invoiceNumber} has been downloaded.`,
    });
  };

  const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {typeIcons[invoice.type]}
              </div>
              <div>
                <DialogTitle className="text-xl">{invoice.invoiceNumber}</DialogTitle>
                <p className="text-sm text-muted-foreground">{typeLabels[invoice.type]}</p>
              </div>
            </div>
            <Badge variant="outline" className={`${statusColors[invoice.status]} gap-1`}>
              {statusIcons[invoice.status]}
              {t(`billing.${invoice.status}`)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Invoice Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
              <p className="text-lg font-bold">{formatCurrency(invoice.amount)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Amount Paid</p>
              <p className="text-lg font-bold text-success">{formatCurrency(invoice.amountPaid)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Balance Due</p>
              <p className={`text-lg font-bold ${invoice.balance > 0 ? 'text-destructive' : 'text-success'}`}>
                {formatCurrency(invoice.balance)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Due Date</p>
              <p className="text-lg font-bold">{formatDate(invoice.dueDate).split(',')[0]}</p>
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tenant Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Tenant Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{invoice.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Unit</span>
                  <span className="text-sm font-medium">{invoice.unitNumber}</span>
                </div>
              </div>
            </div>

            {/* Property Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Property Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Property</span>
                  <span className="text-sm font-medium">{invoice.propertyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Unit Number</span>
                  <span className="text-sm font-medium">{invoice.unitNumber}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Invoice Details
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Description</span>
                <span className="text-sm font-medium">{invoice.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Issue Date</span>
                <span className="text-sm font-medium">{formatDate(invoice.issuedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <span className="text-sm font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paidDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paid Date</span>
                  <span className="text-sm font-medium text-success">{formatDate(invoice.paidDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Water Reading Details */}
          {invoice.waterReading && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Water Reading Details
                </h3>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Meter ID</p>
                      <p className="font-medium text-sm">{invoice.waterReading.meterId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Previous Reading</p>
                      <p className="font-medium text-sm">{invoice.waterReading.previousReading}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current Reading</p>
                      <p className="font-medium text-sm">{invoice.waterReading.currentReading}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Consumption</p>
                      <p className="font-medium text-sm">{invoice.waterReading.consumption} units</p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Rate per Unit</p>
                      <p className="font-medium">{formatCurrency(invoice.waterReading.ratePerUnit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Billing Period</p>
                      <p className="font-medium">{invoice.waterReading.billingPeriod}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reading Date</p>
                      <p className="font-medium">{formatDate(invoice.waterReading.readingDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Payment History */}
          {invoicePayments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment History
                </h3>
                <div className="space-y-2">
                  {invoicePayments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-success/10 rounded-full">
                          <CheckCircle className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.paymentMethod.toUpperCase()} • {payment.transactionRef}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(payment.paymentDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Cancellation Info */}
          {invoice.status === 'cancelled' && (invoice as any).cancellationReason && (
            <>
              <Separator />
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-1">Cancellation Reason</h4>
                <p className="text-sm text-muted-foreground">{(invoice as any).cancellationReason}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            {canEdit && onEdit && (
              <Button variant="outline" onClick={() => onEdit(invoice)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Invoice
              </Button>
            )}
            {canCancel && onCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Invoice
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Invoice {invoice.invoiceNumber}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The invoice will be marked as cancelled.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Enter cancellation reason..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCancelReason('')}>
                      Keep Invoice
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        onCancel(invoice, cancelReason);
                        setCancelReason('');
                      }}
                    >
                      Cancel Invoice
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && onRecordPayment && (
              <Button className="ml-auto" onClick={() => onRecordPayment(invoice)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
