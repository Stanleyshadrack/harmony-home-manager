import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus } from 'lucide-react';

export default function Billing() {
  const { t } = useTranslation();

  return (
    <DashboardLayout
      title={t('billing.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('billing.title') },
      ]}
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Billing & Payments</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Billing functionality including rent invoices, water bills, and payment tracking
            will be available once the database is connected.
          </p>
          <Button disabled className="gap-2">
            <Plus className="h-4 w-4" />
            {t('billing.createInvoice')}
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
