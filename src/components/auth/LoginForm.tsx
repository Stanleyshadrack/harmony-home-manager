import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Shield, Building2, Wrench, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('auth.emailInvalid'),
  password: z.string().min(1, 'auth.passwordRequired'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const roleOptions: { value: UserRole; label: string; icon: React.ReactNode; redirect: string }[] = [
  { value: 'super_admin', label: 'Super Admin', icon: <Shield className="h-4 w-4" />, redirect: '/admin-portal' },
  { value: 'landlord', label: 'Landlord', icon: <Building2 className="h-4 w-4" />, redirect: '/dashboard' },
  { value: 'employee', label: 'Employee', icon: <Wrench className="h-4 w-4" />, redirect: '/employee-portal' },
  { value: 'tenant', label: 'Tenant', icon: <User className="h-4 w-4" />, redirect: '/tenant-portal' },
];

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('landlord');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const { error } = await login(data.email, data.password, selectedRole);
    
    if (error) {
      toast.error(t('auth.invalidCredentials'));
    } else {
      toast.success(t('auth.loginSuccess'));
      const roleConfig = roleOptions.find((r) => r.value === selectedRole);
      navigate(roleConfig?.redirect || '/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Role Selection */}
      <div className="space-y-2">
        <Label>Login as</Label>
        <div className="grid grid-cols-2 gap-2">
          {roleOptions.map((role) => (
            <Button
              key={role.value}
              type="button"
              variant={selectedRole === role.value ? 'default' : 'outline'}
              className="flex items-center justify-start gap-2 h-auto py-3"
              onClick={() => setSelectedRole(role.value)}
            >
              {role.icon}
              <span className="text-sm">{role.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input
          id="email"
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Button
            type="button"
            variant="link"
            className="px-0 font-normal text-muted-foreground"
          >
            {t('auth.forgotPassword')}
          </Button>
        </div>
        <div className="relative">
          <Input
            id="password"
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
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="remember" {...register('rememberMe')} />
        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
          {t('auth.rememberMe')}
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common.loading')}
          </>
        ) : (
          <>
            {roleOptions.find((r) => r.value === selectedRole)?.icon}
            <span className="ml-2">Sign in as {roleOptions.find((r) => r.value === selectedRole)?.label}</span>
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <Button
          type="button"
          variant="link"
          className="px-0 font-semibold text-primary"
          onClick={onSwitchToRegister}
        >
          {t('auth.register')}
        </Button>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        {t('auth.termsAgreement')}
      </p>
    </form>
  );
}
