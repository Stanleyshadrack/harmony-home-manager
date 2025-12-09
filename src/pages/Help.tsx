import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageCircle, FileText, Mail } from 'lucide-react';

export default function Help() {
  const { t } = useTranslation();

  const helpItems = [
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Learn how to use PropManager with our comprehensive guides',
      action: 'View Docs',
    },
    {
      icon: MessageCircle,
      title: 'FAQs',
      description: 'Find answers to commonly asked questions',
      action: 'View FAQs',
    },
    {
      icon: Mail,
      title: 'Contact Support',
      description: 'Get in touch with our support team for assistance',
      action: 'Contact Us',
    },
  ];

  return (
    <DashboardLayout
      title={t('navigation.help')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('navigation.help') },
      ]}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {helpItems.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
              <Button variant="outline" className="w-full" disabled>
                {item.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Need Help?</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Our support resources will be fully available once the system is connected to the backend.
            For now, explore the demo features.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
