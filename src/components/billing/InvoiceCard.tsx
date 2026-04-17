import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  CreditCard,
  FileText,
  Droplets,
  Home,
  Download
} from 'lucide-react';
import type { Invoice } from '@/types/billing';
import { downloadInvoicePDF } from '@/utils/invoicePdf';
import { useToast } from '@/hooks/use-toast';

interface InvoiceCardProps {
  invoice: Invoice;
  onView?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

const typeIcons: Record<Invoice['type'], React.ReactNode> = {
  rent: <Home className="h-4 w-4" />,
  water: <Droplets className="h-4 w-4" />,
  utilities: <FileText className="h-4 w-4" />,
  late_fee: <FileText className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

export function InvoiceCard({ invoice, onView, onRecordPayment }: InvoiceCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  /* =========================
     TYPE LOGIC
  ========================= */

  const isWater = invoice.type === 'water';
  const isRent = invoice.type === 'rent';

  const isOwing = invoice.balance > 0;
  const isCredit = invoice.balance < 0;
  const isSettled = invoice.balance === 0;

  /* =========================
     PAYMENT LOGIC (TYPE AWARE)
  ========================= */

  let paidAmount = 0;
  let progress = 0;

  if (isRent) {
    const paidRaw = invoice.amount - invoice.balance;
    paidAmount = Math.min(invoice.amount, Math.max(0, paidRaw));
    progress =
  invoice.amount > 0
    ? (paidAmount / invoice.amount) * 100
    : 100;
  } else if (isWater) {
    paidAmount = invoice.balance <= 0 ? invoice.amount : 0;
    progress = invoice.balance <= 0 ? 100 : 0;
  }

  progress = Math.min(Math.max(progress, 0), 100);

  const canPay = invoice.balance > 0.01;

  /* =========================
     STATUS LABEL
  ========================= */

  const statusLabel = isWater
    ? invoice.balance <= 0
      ? 'Settled'
      : 'Unpaid'
    : isCredit
    ? 'Overpaid'
    : isSettled
    ? 'Paid'
    : invoice.balance < invoice.amount
    ? 'Partial'
    : 'Unpaid';

  /* =========================
     ACTIONS
  ========================= */

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
      description: `Invoice ${invoice.invoiceNumber} downloaded.`,
    });
  };

  /* =========================
     UI
  ========================= */

  return (
    <Card className="hover:shadow-md transition-all border">
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          {/* LEFT */}
          <div className="flex gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {typeIcons[invoice.type]}
            </div>
            <div>
              <p className="font-semibold">{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">
                {invoice.tenantName}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                isCredit
                  ? 'text-blue-600 border-blue-200'
                  : isOwing
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-success/10 text-success border-success/20'
              }
            >
              {statusLabel}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(invoice)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>

                {canPay && (
                  <DropdownMenuItem onClick={() => onRecordPayment?.(invoice)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* PROPERTY */}
        <div className="text-sm text-muted-foreground mb-3">
          {invoice.propertyName} • Unit {invoice.unitNumber}
        </div>

        {/* AMOUNTS */}
        <div className="grid grid-cols-2 gap-4 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {t('billing.totalDue')}
            </p>
            <p className="font-semibold">
              {formatCurrency(invoice.amount)}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              {t('billing.balance')}
            </p>
            <p
              className={`font-semibold ${
                isOwing
                  ? 'text-destructive'
                  : isCredit
                  ? 'text-blue-600'
                  : 'text-success'
              }`}
            >
              {isCredit
                ? `Credit ${formatCurrency(Math.abs(invoice.balance))}`
                : formatCurrency(invoice.balance)}
            </p>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${
                isWater
                  ? progress === 100
                    ? 'bg-success'
                    : 'bg-destructive'
                  : isCredit
                  ? 'bg-blue-500'
                  : isOwing
                  ? 'bg-destructive'
                  : 'bg-success'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

<div className="text-xs text-muted-foreground mt-1">
  {isWater && invoice.waterReading ? (
    <>
      <div>
        {invoice.waterReading.previousReading} → {invoice.waterReading.currentReading}
      </div>
      <div>
        {invoice.balance <= 0 ? "Bill settled" : "Pending payment"}
      </div>
    </>
  ) : (
    `Paid ${formatCurrency(paidAmount)} of ${formatCurrency(invoice.amount)}`
  )}
</div>
        </div>

        {/* DATES */}
        <div className="flex justify-between text-xs mt-4 pt-3 border-t text-muted-foreground">
          <span>Due: {formatDate(invoice.dueDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}