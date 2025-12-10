import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Invoice } from '@/types/billing';

interface BillingStatsProps {
  invoices: Invoice[];
  totalRevenue: number;
  totalOutstanding: number;
}

export function BillingStats({ invoices, totalRevenue, totalOutstanding }: BillingStatsProps) {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const pendingCount = invoices.filter((i) => i.status === 'pending').length;
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(totalOutstanding),
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: t('billing.overdue'),
      value: overdueCount.toString(),
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: t('billing.paid'),
      value: paidCount.toString(),
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
