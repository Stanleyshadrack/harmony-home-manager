import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, RotateCcw, Droplets, CreditCard, Wrench, Users } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { toast } from 'sonner';

const channels = [
  { key: 'inApp' as const, label: 'In-App', icon: Bell, description: 'Notifications in the app' },
  { key: 'email' as const, label: 'Email', icon: Mail, description: 'Email notifications (simulated)' },
  { key: 'sms' as const, label: 'SMS', icon: MessageSquare, description: 'Text message alerts (simulated)' },
];

const categories = [
  { key: 'waterReadings' as const, label: 'Water Readings', icon: Droplets, description: 'Approvals and updates' },
  { key: 'payments' as const, label: 'Payments', icon: CreditCard, description: 'Payment confirmations and reminders' },
  { key: 'maintenance' as const, label: 'Maintenance', icon: Wrench, description: 'Request updates and assignments' },
  { key: 'messages' as const, label: 'Messages', icon: MessageSquare, description: 'New messages and replies' },
  { key: 'tenantApplications' as const, label: 'Tenant Applications', icon: Users, description: 'New applications and approvals' },
];

export function NotificationPreferences() {
  const { t } = useTranslation();
  const { preferences, updateChannelPreference, resetToDefaults, isLoading } = useNotificationPreferences();

  const handleToggle = (
    channel: 'inApp' | 'email' | 'sms',
    key: 'enabled' | 'waterReadings' | 'payments' | 'maintenance' | 'messages' | 'tenantApplications',
    value: boolean
  ) => {
    updateChannelPreference(channel, key, value);
    toast.success(`${channels.find(c => c.key === channel)?.label} ${key === 'enabled' ? (value ? 'enabled' : 'disabled') : `${key} ${value ? 'enabled' : 'disabled'}`}`);
  };

  const handleReset = () => {
    resetToDefaults();
    toast.success('Notification preferences reset to defaults');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading preferences...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('settings.notifications')}
          </CardTitle>
          <CardDescription>
            Choose how and when you want to be notified
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {channels.map((channel) => (
          <div key={channel.key} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <channel.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{channel.label}</Label>
                    {channel.key !== 'inApp' && (
                      <Badge variant="outline" className="text-xs">Simulated</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                </div>
              </div>
              <Switch
                checked={preferences[channel.key].enabled}
                onCheckedChange={(checked) => handleToggle(channel.key, 'enabled', checked)}
              />
            </div>
            
            {preferences[channel.key].enabled && (
              <div className="ml-12 grid gap-3 pl-4 border-l-2 border-muted">
                {categories.map((category) => (
                  <div key={category.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <category.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-sm">{category.label}</Label>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[channel.key][category.key]}
                      onCheckedChange={(checked) => handleToggle(channel.key, category.key, checked)}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {channel.key !== 'sms' && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
