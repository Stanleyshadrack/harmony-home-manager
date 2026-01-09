import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole } from '@/contexts/AuthContext';
import { usePendingRegistrations } from '@/hooks/useRegistrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, User, Wrench, Building2, CheckCircle2 } from 'lucide-react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('auth.emailInvalid'),
  phone: z.string().min(10, 'Phone number is required'),
  idNumber: z.string().min(5, 'ID number is required'),
  password: z.string().min(8, 'auth.passwordTooShort'),
  confirmPassword: z.string().min(1, 'auth.passwordRequired'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'auth.passwordMismatch',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onEmailVerification?: (email: string) => void;
}

const roleOptions: { value: UserRole; label: string; icon: React.ReactNode; description: string; requiresApproval: boolean }[] = [
  { 
    value: 'tenant', 
    label: 'Tenant', 
    icon: <User className="h-5 w-5" />, 
    description: 'Apply for units, pay bills, submit requests',
    requiresApproval: true,
  },
  { 
    value: 'employee', 
    label: 'Employee', 
    icon: <Wrench className="h-5 w-5" />, 
    description: 'Handle maintenance, record readings',
    requiresApproval: true,
  },
  { 
    value: 'landlord', 
    label: 'Landlord', 
    icon: <Building2 className="h-5 w-5" />, 
    description: 'Manage properties, units, and tenants',
    requiresApproval: false,
  },
];

export function RegisterForm({ onSwitchToLogin, onEmailVerification }: RegisterFormProps) {
  const { t } = useTranslation();
  const { submitRegistration } = usePendingRegistrations();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('tenant');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password') || '';

  const selectedRoleConfig = roleOptions.find((r) => r.value === selectedRole);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await submitRegistration({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        idNumber: data.idNumber,
        termsAccepted: data.termsAccepted,
        requestedRole: selectedRole,
      });

      // Generate email verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationData = {
        email: data.email,
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      };
      localStorage.setItem('emailVerificationPending', JSON.stringify(verificationData));

      // Trigger email verification flow
      if (onEmailVerification) {
        toast.success('Registration submitted! Please verify your email.', {
          description: `Demo verification code: ${verificationCode}`,
          duration: 15000,
        });
        onEmailVerification(data.email);
      } else if (selectedRoleConfig?.requiresApproval) {
        setIsSubmitted(true);
      } else {
        toast.success(t('auth.registrationSuccess'));
        onSwitchToLogin();
      }
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-semibold">Registration Submitted!</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Your {selectedRoleConfig?.label} account request has been submitted. 
          An administrator will review your application and you'll be notified once approved.
        </p>
        <Button onClick={onSwitchToLogin} className="mt-4">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Role Selection */}
      <div className="space-y-2">
        <Label>Register as</Label>
        <div className="grid grid-cols-1 gap-2">
          {roleOptions.map((role) => (
            <Card
              key={role.value}
              className={`cursor-pointer transition-all ${
                selectedRole === role.value
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedRole(role.value)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedRole === role.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {role.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{role.label}</p>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
                {role.requiresApproval && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                    Requires Approval
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('auth.firstName')}</Label>
          <Input
            id="firstName"
            placeholder="John"
            {...register('firstName')}
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('auth.lastName')}</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            {...register('lastName')}
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">{t('auth.email')}</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{t(errors.email.message || '')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t('auth.phone')}</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+254 700 000 000"
          {...register('phone')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">{t('auth.password')}</Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{t(errors.password.message || '')}</p>
        )}
        <PasswordStrengthIndicator password={passwordValue} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{t(errors.confirmPassword.message || '')}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common.loading')}
          </>
        ) : (
          <>
            {selectedRoleConfig?.icon}
            <span className="ml-2">
              {selectedRoleConfig?.requiresApproval 
                ? `Submit ${selectedRoleConfig.label} Application`
                : t('auth.register')}
            </span>
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')}{' '}
        <Button
          type="button"
          variant="link"
          className="px-0 font-semibold text-primary"
          onClick={onSwitchToLogin}
        >
          {t('auth.login')}
        </Button>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        {t('auth.termsAgreement')}
      </p>
    </form>
  );
}
