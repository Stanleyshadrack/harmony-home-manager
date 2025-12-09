import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

export default function Tenants() {
  const { t } = useTranslation();

  return (
    <DashboardLayout
      title={t('tenants.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('tenants.title') },
      ]}
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Tenant Management</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Tenant management functionality will be available once the database is connected.
            Enable Lovable Cloud to get started.
          </p>
          <Button disabled className="gap-2">
            <Plus className="h-4 w-4" />
            {t('tenants.addTenant')}
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
