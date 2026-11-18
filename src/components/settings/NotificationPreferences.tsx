import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, RotateCcw, Droplets, CreditCard, Wrench, Users, Play, Volume2, VolumeX } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { SOUND_TUNES, playNotificationTune, NotificationSoundSettings } from '@/services/notificationSound';

const channels = [
  { key: 'inApp' as const, label: 'In-App', icon: Bell, description: 'Notifications in the app' },
  { key: 'email' as const, label: 'Email', icon: Mail, description: 'Email notifications (when SMTP is configured)' },
  { key: 'sms' as const, label: 'SMS', icon: MessageSquare, description: 'SMS requires a configured sending provider' },
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
  const { preferences, updateChannelPreference, resetToDefaults, updateSoundSettings, isLoading, error } = useNotificationPreferences();
  const [savingSound, setSavingSound] = useState(false);
  const [volume, setVolume] = useState(45);

  useEffect(() => {
    setVolume(preferences.sound.volume);
  }, [preferences.sound.volume]);

  const saveSound = async (settings: NotificationSoundSettings) => {
    if (savingSound) return;
    setSavingSound(true);
    try {
      await updateSoundSettings(settings);
      toast.success('Sound settings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save sound settings');
    } finally {
      setSavingSound(false);
    }
  };

  const previewSound = (settings: NotificationSoundSettings) => {
    void playNotificationTune(settings, true).catch(() =>
      toast.error('Audio playback was blocked. Interact with the page and try again.'));
  };

  const handleToggle = (
    channel: 'inApp' | 'email' | 'sms',
    key: 'enabled' | 'waterReadings' | 'payments' | 'maintenance' | 'messages' | 'tenantApplications',
    value: boolean
  ) => {
    void updateChannelPreference(channel, key, value)
      .then(() => toast.success('Notification preferences saved'))
      .catch(error => toast.error(error instanceof Error ? error.message : 'Unable to save notification preferences'));
  };

  const handleReset = () => {
    void resetToDefaults().then(() => toast.success('Notification preferences reset to defaults')).catch(error => toast.error(error instanceof Error ? error.message : 'Unable to reset preferences'));
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

  if (error) {
    return <Card><CardContent className="py-6 text-destructive" role="alert">Could not load notification preferences: {error}</CardContent></Card>;
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
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {preferences.sound.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              <div>
                <Label htmlFor="notification-sound-enabled" className="font-medium">Notification sound</Label>
                <p className="text-xs text-muted-foreground">A chime only for new in-app notifications, not older messages on sign-in.</p>
              </div>
            </div>
            <Switch id="notification-sound-enabled"
              disabled={savingSound}
              checked={preferences.sound.enabled}
              onCheckedChange={enabled => void saveSound({...preferences.sound, enabled})} />
          </div>
          <div className="space-y-2">
            <Label>Choose a tune (preview any of the five)</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SOUND_TUNES.map(tune => (
                <div key={tune.id} className="flex items-center gap-2 rounded-md border p-2">
                  <Button type="button" size="sm"
                    disabled={savingSound}
                    variant={preferences.sound.tune === tune.id ? 'default' : 'outline'}
                    className="min-w-0 flex-1 justify-start"
                    onClick={() => void saveSound({...preferences.sound, tune: tune.id})}>
                    <span className="truncate">{tune.name}</span>
                  </Button>
                  <Button type="button" size="icon" variant="outline" aria-label={`Preview ${tune.name}`}
                    onClick={() => previewSound({...preferences.sound, tune: tune.id, volume: Math.max(volume, 1)})}>
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{SOUND_TUNES.find(t => t.id === preferences.sound.tune)?.description}</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between"><Label htmlFor="notification-volume">Sound volume</Label><span className="text-sm text-muted-foreground">{volume}%</span></div>
            <Slider id="notification-volume" min={0} max={100} step={5}
              value={[volume]} disabled={savingSound}
              onValueChange={values => setVolume(values[0])}
              onValueCommit={values => void saveSound({...preferences.sound, volume: values[0]})} />
          </div>
          <p className="text-xs text-muted-foreground">
            Your sound selection is saved per account. Browsers may require a click before they allow sound playback.
          </p>
        </div>
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
                      <Badge variant="outline" className="text-xs">Provider-dependent</Badge>
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
