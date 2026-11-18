import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Camera, Save, Loader2 } from 'lucide-react';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { MaintenanceControl } from '@/components/settings/MaintenanceControl';
import { IdleLockPreferences } from '@/components/settings/IdleLockPreferences';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, ShieldCheck, UserRound } from 'lucide-react';
import { useProtectedMedia } from '@/hooks/useProtectedMedia';
import { apiRequest } from '@/api/https';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const loadedAvatar = useProtectedMedia(formData.avatarUrl);

  // Revoke the temporary URL when a different image is selected or the
  // editing session ends. Do not store image data in localStorage.
  useEffect(() => () => {
    if (previewAvatar) URL.revokeObjectURL(previewAvatar);
  }, [previewAvatar]);
  const [savedProfile, setSavedProfile] = useState<typeof formData | null>(null);
  const [profileError, setProfileError] = useState('');
  useEffect(() => {
    let active = true;
    apiRequest<null, {firstName?:string;lastName?:string;phone?:string;avatarUrl?:string}>({ path:'/api/users/me', method:'GET' })
      .then(profile => { if (active) { const next = { firstName:profile.firstName || '', lastName:profile.lastName || '', phone:profile.phone || '', avatarUrl:profile.avatarUrl || '' }; setFormData(next); setSavedProfile(next); } })
      .catch(e => { if (active) setProfileError(e instanceof Error ? e.message : 'Profile could not be loaded'); });
    return () => { active = false; };
  }, [user?.id]);

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast({ title: 'Invalid image', description: 'Choose JPG, PNG, GIF or WEBP.',
        variant: 'destructive' });
      return;
    }
    if (!file.size || file.size > 3 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Profile pictures must be 3 MB or smaller.',
        variant: 'destructive' });
      return;
    }
    setPendingAvatar(file);
    setPreviewAvatar(URL.createObjectURL(file));
  };

  const removeAvatar = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await apiRequest<null, typeof formData>({
        path: '/api/users/me/avatar', method: 'DELETE',
      });
      setPendingAvatar(null);
      setPreviewAvatar(null);
      const next = { firstName: result.firstName || '', lastName: result.lastName || '',
        phone: result.phone || '', avatarUrl: result.avatarUrl || '' };
      setFormData(next);
      setSavedProfile(next);
      await refreshProfile();
      toast({ title: 'Profile photo removed' });
    } catch (error) {
      toast({ title: 'Unable to remove photo',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || isSaving) return;
    setIsSaving(true);
    try {
      let saved = await apiRequest<{
        firstName: string; lastName: string; phone: string;
      }, typeof formData>({
        path: '/api/users/me', method: 'PUT',
        body: { firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone },
      });
      if (pendingAvatar) {
        const payload = new FormData();
        payload.append('file', pendingAvatar);
        saved = await apiRequest<FormData, typeof formData>({
          path: '/api/users/me/avatar', method: 'POST', body: payload, timeout: 30000,
        });
      }
      const next = { firstName: saved.firstName || '', lastName: saved.lastName || '',
        phone: saved.phone || '', avatarUrl: saved.avatarUrl || '' };
      setFormData(next);
      setSavedProfile(next);
      setPendingAvatar(null);
      setIsEditing(false);
      setPreviewAvatar(null);
      setProfileError('');
      await refreshProfile();
      toast({ title: 'Profile Updated', description: 'Your profile was saved to the server.' });
    } catch (error) {
      toast({ title: 'Update Failed', description: error instanceof Error ? error.message : 'Unable to save profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (savedProfile) setFormData(savedProfile);
    setPendingAvatar(null);
    setPreviewAvatar(null);
    setIsEditing(false);
  };

  const displayAvatar = previewAvatar || loadedAvatar || undefined;

  return (
    <DashboardLayout
      title={t('settings.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('settings.title') },
      ]}
    >
      {profileError && <p role="alert" className="text-destructive mb-4">{profileError}</p>}
      <Tabs defaultValue="account" className="space-y-5">
        <TabsList className="h-auto flex flex-wrap justify-start gap-1">
          <TabsTrigger value="account" className="gap-2"><UserRound className="h-4 w-4" />Profile & Account</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><ShieldCheck className="h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Notifications & Sounds</TabsTrigger>
          {user?.role === 'super_admin' && <TabsTrigger value="maintenance">System Maintenance</TabsTrigger>}
        </TabsList>
        <TabsContent value="account" className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('settings.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-2 right-0 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <h3 className="text-xl font-semibold">
              {formData.firstName ? `${formData.firstName} ${formData.lastName}` : 'Account'}
            </h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge className="mt-2">{t(`roles.${user?.role}`)}</Badge>
            {isEditing && (formData.avatarUrl || pendingAvatar) && (
              <Button type="button" size="sm" variant="outline"
                className="mt-2" disabled={isSaving}
                onClick={() => void removeAvatar()}>
                Remove profile photo
              </Button>
            )}
            {!isEditing && (
              <Button variant="outline" className="mt-4 w-full" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('settings.account')}</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit your account information' : 'View your account information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    className="pl-9"
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    className="pl-9"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ''}
                  className="pl-9"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="pl-9"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </CardContent>
        </Card>

        </TabsContent>
        <TabsContent value="security" className="space-y-5">
        <IdleLockPreferences />
        <Card><CardHeader><CardTitle>Account security</CardTitle>
          <CardDescription>Security is enforced by the server. Super Admin sign-in requires the configured email verification flow. This screen does not create or revoke login sessions or enable an authenticator app.</CardDescription>
          </CardHeader><CardContent className="text-sm text-muted-foreground">Use Sign Out to end your current browser session. Contact your administrator for account access and verification changes.</CardContent></Card>

        </TabsContent>
        <TabsContent value="notifications" className="space-y-5">
        {/* Notification Preferences */}
        <div className="max-w-4xl">
          <NotificationPreferences />
        </div>
        </TabsContent>
        {user?.role === 'super_admin' && (
          <TabsContent value="maintenance" className="max-w-4xl">
            <MaintenanceControl />
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
}
