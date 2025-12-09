import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  const { t } = useTranslation();

  return (
    <DashboardLayout
      title={t('navigation.reports')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('navigation.reports') },
      ]}
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Reports & Analytics</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Comprehensive reports including occupancy rates, revenue tracking, and insights
            will be available once the database is connected.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
