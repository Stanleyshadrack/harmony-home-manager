import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useInvitations } from '@/hooks/useInvitations';
import { usePendingRegistrations } from '@/hooks/useRegistrations';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2,
  Mail,
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  UserCheck,
  Users,
} from 'lucide-react';

const onboardingSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number is required'),
    idNumber: z.string().min(5, 'ID number is required'),
    // Tenant-only optional fields
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    relationship: z.string().optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { getInvitationByToken, acceptInvitation } = useInvitations();
  const { submitRegistration } = usePendingRegistrations();

  const [invitation, setInvitation] = useState<ReturnType<typeof getInvitationByToken>>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      idNumber: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      relationship: '',
      termsAccepted: false,
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');
  const isTenant = invitation?.role === 'tenant';

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please check your email for the correct link.');
      setIsLoading(false);
      return;
    }

    // Small delay to simulate loading
    setTimeout(() => {
      const inv = getInvitationByToken(token);
      if (!inv) {
        setError('Invitation not found. It may have been revoked or already used.');
      } else if (inv.status === 'expired') {
        setError('This invitation has expired. Please request a new one.');
      } else if (inv.status === 'accepted') {
        setError('This invitation has already been used.');
      } else if (inv.status !== 'pending') {
        setError('This invitation is no longer valid.');
      } else {
        setInvitation(inv);
      }
      setIsLoading(false);
    }, 500);
  }, [token, getInvitationByToken]);

  const onSubmit = async (data: OnboardingFormData) => {
    if (!invitation || !token) return;

    setIsSubmitting(true);
    try {
      // Accept the invitation
      const accepted = await acceptInvitation(token);
      if (!accepted) {
        toast.error('Failed to process invitation');
        setIsSubmitting(false);
        return;
      }

      // Create pending registration with extended data
      await submitRegistration({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        idNumber: data.idNumber,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        relationship: data.relationship,
        termsAccepted: data.termsAccepted,
        requestedRole: invitation.role,
      });

      // Store password for demo (in production, this would go to the backend)
      localStorage.setItem(`pending_password_${invitation.email}`, data.password);
      
      // Store verification code for demo
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem(`email_verification_${invitation.email}`, JSON.stringify({
        code: verificationCode,
        verified: true, // Auto-verify for invited users
        createdAt: new Date().toISOString(),
      }));

      setIsComplete(true);
      toast.success('Onboarding complete!', {
        description: 'Your account is now pending approval.',
      });
    } catch (err) {
      toast.error('Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      tenant: 'Tenant',
      employee: 'Employee',
      landlord: 'Landlord',
    };
    return labels[role] || role;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold">Invalid Invitation</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold">Onboarding Complete!</h2>
              <p className="text-muted-foreground">
                Your account has been created and is now pending approval. You will receive an email
                once your account has been reviewed.
              </p>
              <div className="flex items-center justify-center gap-2 text-warning">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Awaiting Admin Approval</span>
              </div>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/20 rounded-lg backdrop-blur">
              <Building2 className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold">{t('common.appName')}</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">Welcome Aboard!</h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              You've been invited to join our property management platform. Complete the form to set
              up your account and get started.
            </p>

            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-primary-foreground/10 rounded-lg backdrop-blur">
                <CheckCircle className="h-5 w-5" />
                <span>Complete your profile</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-primary-foreground/10 rounded-lg backdrop-blur">
                <Clock className="h-5 w-5" />
                <span>Await admin approval</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-primary-foreground/10 rounded-lg backdrop-blur">
                <Lock className="h-5 w-5" />
                <span>Verify with OTP on login</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-primary-foreground/60">
            © 2024 PropManager. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">Complete Your Profile</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You're being invited as a{' '}
                <Badge variant="secondary" className="ml-1">
                  {getRoleLabel(invitation?.role || '')}
                </Badge>
              </p>
            </div>

            {invitation && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Invitation for</p>
                      <p className="font-medium">{invitation.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Invited by {invitation.invitedBy} • Expires{' '}
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          className="pl-10"
                          {...register('firstName')}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        {...register('lastName')}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+254 700 000 000"
                        className="pl-10"
                        {...register('phone')}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="idNumber"
                        placeholder="Enter your ID number"
                        className="pl-10"
                        {...register('idNumber')}
                      />
                    </div>
                    {errors.idNumber && (
                      <p className="text-sm text-destructive">{errors.idNumber.message}</p>
                    )}
                  </div>

                  {/* Tenant-only emergency contact fields */}
                  {isTenant && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Emergency Contact (Optional)
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContactName">Contact Name</Label>
                          <div className="relative">
                            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="emergencyContactName"
                              placeholder="Emergency contact name"
                              className="pl-10"
                              {...register('emergencyContactName')}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="emergencyContactPhone"
                              type="tel"
                              placeholder="+254 700 000 000"
                              className="pl-10"
                              {...register('emergencyContactPhone')}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relationship">Relationship</Label>
                        <Input
                          id="relationship"
                          placeholder="e.g., Spouse, Parent, Sibling"
                          {...register('relationship')}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10"
                        {...register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                    {password && <PasswordStrengthIndicator password={password} />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pl-10"
                        {...register('confirmPassword')}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                      id="termsAccepted"
                      onCheckedChange={(checked) => {
                        const event = {
                          target: { name: 'termsAccepted', value: checked },
                        };
                        register('termsAccepted').onChange(event as any);
                      }}
                      {...register('termsAccepted')}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="termsAccepted" className="text-sm cursor-pointer">
                        I accept the terms and conditions *
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        By checking this box, you agree to our Terms of Service and Privacy Policy.
                      </p>
                      {errors.termsAccepted && (
                        <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-warning">Approval Required</p>
                        <p className="text-muted-foreground">
                          After completing this form, your account will be reviewed by an
                          administrator before you can log in.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      'Complete Onboarding'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/auth')}>
                Sign in
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
