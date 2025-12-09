import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';

export default function Messages() {
  const { t } = useTranslation();

  return (
    <DashboardLayout
      title={t('messages.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('messages.title') },
      ]}
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Messages</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Real-time messaging between tenants, employees, and landlords
            will be available once the database is connected.
          </p>
          <Button disabled className="gap-2">
            <Plus className="h-4 w-4" />
            {t('messages.newMessage')}
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
