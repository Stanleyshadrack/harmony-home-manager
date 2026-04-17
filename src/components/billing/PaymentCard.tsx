import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Building2, Banknote } from 'lucide-react';
import type { Invoice, Payment } from '@/types/billing';

interface PaymentCardProps {
  payment: Payment;
  invoice?: Invoice;
}

const methodIcons: Record<Payment['method'], React.ReactNode> = {
  mpesa: <Smartphone className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  bank: <Building2 className="h-4 w-4" />,
  cash: <Banknote className="h-4 w-4" />,
};


const statusColors = {
  success: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusIcons = {
  success: "✅",
  pending: "⏳",
  failed: "❌",
};

const methodColors: Record<Payment['method'], string> = {
  mpesa: 'bg-green-500/10 text-green-600 border-green-500/20',
  card: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  bank: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  cash: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export function PaymentCard({ payment, invoice }: PaymentCardProps) {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg text-success">
              {methodIcons[payment.method]}
            </div>
            <div>
              <p className="font-semibold text-success">{formatCurrency(payment.amount)}</p>
              <p className="text-sm text-muted-foreground">{invoice?.tenantName}</p>
            </div>
          </div>
         <div className="flex flex-col items-end gap-1">
  <Badge variant="outline" className={methodColors[payment.method]}>
    {t(`billing.${payment.method}`)}
  </Badge>

  <Badge
    variant="outline"
    className={statusColors[payment.status]}
  >
    {statusIcons[payment.status]} {payment.status}
  </Badge>
</div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
  <span className="text-muted-foreground">Invoice:</span>
  <div className="text-right">
    <p className="font-medium">
      {payment.invoiceNumber ?? `#${payment.invoiceId}`}
    </p>
    {invoice?.invoiceNumber && (
      <p className="text-xs text-muted-foreground">
        ID: {payment.invoiceId}
      </p>
    )}
  </div>
</div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference:</span>
            <span className="font-mono text-xs">{payment.transactionRef}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('common.date')}:</span>
            <span>{formatDate(payment.paymentDate)}</span>
          </div>
        </div>

        {payment.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">{payment.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
