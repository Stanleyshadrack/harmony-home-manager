import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, LogIn, UserCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const demoAccounts = [
  { label: 'Super Admin', email: 'admin@demo.com', password: 'admin123' },
  { label: 'Landlord', email: 'landlord@demo.com', password: 'landlord123' },
  { label: 'Employee', email: 'employee@demo.com', password: 'employee123' },
  { label: 'Tenant', email: 'tenant@demo.com', password: 'tenant123' },
];

const loginSchema = z.object({
  email: z.string().email('auth.emailInvalid'),
  password: z.string().min(1, 'auth.passwordRequired'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const fillDemoCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    toast.success('Demo credentials filled');
  };

  const onSubmit = async (data: LoginFormData) => {
    const { error, redirect } = await login(data.email, data.password);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success(t('auth.loginSuccess'));
      navigate(redirect || '/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              {t('auth.login')}
            </>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="icon" title="Demo Login">
              <UserCheck className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {demoAccounts.map((account) => (
              <DropdownMenuItem
                key={account.email}
                onClick={() => fillDemoCredentials(account.email, account.password)}
              >
                {account.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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