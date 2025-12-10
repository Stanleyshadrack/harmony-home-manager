import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Building2, Banknote } from 'lucide-react';
import type { Payment } from '@/types/billing';

interface PaymentCardProps {
  payment: Payment;
}

const methodIcons: Record<Payment['paymentMethod'], React.ReactNode> = {
  mpesa: <Smartphone className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  bank: <Building2 className="h-4 w-4" />,
  cash: <Banknote className="h-4 w-4" />,
};

const methodColors: Record<Payment['paymentMethod'], string> = {
  mpesa: 'bg-green-500/10 text-green-600 border-green-500/20',
  card: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  bank: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  cash: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export function PaymentCard({ payment }: PaymentCardProps) {
  const { t } = useTranslation();

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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg text-success">
              {methodIcons[payment.paymentMethod]}
            </div>
            <div>
              <p className="font-semibold text-success">{formatCurrency(payment.amount)}</p>
              <p className="text-sm text-muted-foreground">{payment.tenantName}</p>
            </div>
          </div>
          <Badge variant="outline" className={methodColors[payment.paymentMethod]}>
            {t(`billing.${payment.paymentMethod}`)}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice:</span>
            <span className="font-medium">{payment.invoiceNumber}</span>
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
