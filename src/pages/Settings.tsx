import { useState, useRef } from 'react';
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
import { SessionManager } from '@/components/settings/SessionManager';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { updateUserProfile, fileToBase64 } from '@/services/userManagementService';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
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

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setPreviewAvatar(base64);
      setFormData((prev) => ({ ...prev, avatarUrl: base64 }));
    } catch {
      toast({
        title: 'Upload Failed',
        description: 'Failed to process the image.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const result = updateUserProfile(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
      });

      if (result.success) {
        // Update the auth user in localStorage to reflect changes immediately
        const authUser = localStorage.getItem('auth_user');
        if (authUser) {
          const parsed = JSON.parse(authUser);
          const updated = {
            ...parsed,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            avatarUrl: formData.avatarUrl,
          };
          localStorage.setItem('auth_user', JSON.stringify(updated));
        }

        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully.',
        });
        setIsEditing(false);
        setPreviewAvatar(null);
        // Reload to reflect changes
        window.location.reload();
      } else {
        toast({
          title: 'Update Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      avatarUrl: user?.avatarUrl || '',
    });
    setPreviewAvatar(null);
    setIsEditing(false);
  };

  const displayAvatar = previewAvatar || formData.avatarUrl;

  return (
    <DashboardLayout
      title={t('settings.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('settings.title') },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
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
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <h3 className="text-xl font-semibold">
              {formData.firstName ? `${formData.firstName} ${formData.lastName}` : 'Demo User'}
            </h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge className="mt-2">{t(`roles.${user?.role}`)}</Badge>
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

        {/* Security - 2FA Setup */}
        <TwoFactorSetup />

        {/* Session Management */}
        <div className="lg:col-span-2">
          <SessionManager />
        </div>

        {/* Notification Preferences */}
        <div className="lg:col-span-2">
          <NotificationPreferences />
        </div>
      </div>
    </DashboardLayout>
  );
}
