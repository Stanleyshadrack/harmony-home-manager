import { useState, useEffect } from 'react';
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
import { Eye, EyeOff, Loader2, LogIn, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  isAccountLocked,
  recordFailedAttempt,
  resetAttempts,
  formatRemainingTime,
  getMaxAttempts,
} from '@/services/loginSecurityService';
import { loginService } from '@/api/service/login.service';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { tokenService } from '@/services/tokenService';
import { consumeUnlockDestination } from '@/services/sessionLock';
import { jwtDecode } from 'jwt-decode';
import type { JwtPayload } from '@/types/auth';

const loginSchema = z.object({
  email: z.string().email('auth.emailInvalid'),
  password: z.string().min(1, 'auth.passwordRequired'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
 onRequireOTP?: (email: string, redirect: string | null) => void;
  onAwaitingApproval?: (email: string, role: string) => void;
  onForcePasswordChange?: (email: string) => void;
}



export function LoginForm({ onSwitchToRegister, onForgotPassword, onRequireOTP, onAwaitingApproval, onForcePasswordChange }: LoginFormProps) {
  const { t } = useTranslation();
  const { completeLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{ locked: boolean; remainingMs: number }>({ locked: false, remainingMs: 0 });
  const [attemptsWarning, setAttemptsWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const emailValue = watch('email');

  // Check lockout status when email changes
  useEffect(() => {
    if (emailValue) {
      const status = isAccountLocked(emailValue);
      setLockoutInfo(status);
      if (!status.locked) {
        setAttemptsWarning(null);
      }
    }
  }, [emailValue]);

  // Update countdown timer
  useEffect(() => {
    if (lockoutInfo.locked && lockoutInfo.remainingMs > 0) {
      const interval = setInterval(() => {
        const status = isAccountLocked(emailValue);
        setLockoutInfo(status);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutInfo.locked, emailValue]);

  const onSubmit = async (data: LoginFormData) => {
  const lockStatus = isAccountLocked(data.email);
  if (lockStatus.locked) {
    setLockoutInfo(lockStatus);
    toast.error(
      `Account locked. Try again in ${formatRemainingTime(lockStatus.remainingMs)}`
    );
    return;
  }

  

  setIsSubmitting(true);
  try {
    const res = await loginService({
  email: data.email,
  password: data.password,
});

// 🔐 MFA REQUIRED → STOP here
if (res.mfaRequired) {
  resetAttempts(data.email);
  toast.info("Verification required", {
    description: "A verification code has been sent to your email.",
  });

  onRequireOTP?.(data.email, null);
  return; // DO NOT continue
}

// Non-MFA users must use the same token store and auth context as MFA users.
tokenService.setTokens({
  accessToken: res.accessToken,
  refreshToken: res.refreshToken,
});
completeLogin(res.accessToken);
resetAttempts(data.email);

const jwt = jwtDecode<JwtPayload>(res.accessToken);
const homeByRole: Record<string, string> = {
  super_admin: "/admin-portal",
  landlord: "/dashboard",
  employee: "/employee-portal",
  tenant: "/tenant-portal",
};
const destination = homeByRole[String(jwt.role).toLowerCase()];
if (!destination) {
  tokenService.clearTokens();
  throw new Error("Unrecognized user role");
}

const restoredPath = consumeUnlockDestination(data.email, destination);
toast.success(t("auth.loginSuccess"));
navigate(restoredPath, { replace: true });


  } catch (err: any) {
    const message = String(err?.message || "");
    if (message.includes("Password change required")) {
      onForcePasswordChange?.(data.email);
      return;
    }
    // A mail service outage or access-policy denial is not a wrong password.
    if (!message.includes("[HTTP 401]")) {
      toast.error(message || "Unable to sign in");
      return;
    }
    const result = recordFailedAttempt(data.email);

    if (result.locked) {
      setLockoutInfo({ locked: true, remainingMs: 0* 5 * 1000 });
      toast.error("Too many failed attempts. Account locked for 5 minutes.");
    } else {
      setAttemptsWarning(
        `${result.attemptsRemaining} attempt${
          result.attemptsRemaining !== 1 ? "s" : ""
        } remaining before lockout`
      );
      toast.error(err.message || "Invalid credentials");
    }
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Lockout Alert */}
      {lockoutInfo.locked && (
  <Alert variant="destructive">
    <Lock className="h-4 w-4" />
    <AlertDescription>
      Account temporarily locked due to too many failed attempts.
      {lockoutInfo.remainingMs > 0 && (
        <> Try again in {formatRemainingTime(lockoutInfo.remainingMs)}.</>
      )}
    </AlertDescription>
  </Alert>
)}


      {/* Attempts Warning */}
      {attemptsWarning && !lockoutInfo.locked && (
        <Alert>
          <AlertDescription className="text-warning">
            {attemptsWarning}
          </AlertDescription>
        </Alert>
      )}
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
            onClick={onForgotPassword}
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
        <Button type="submit" className="flex-1" disabled={isSubmitting || isLoading || lockoutInfo.locked}>
          {isSubmitting || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              {t('auth.login')}
            </>
          )}
        </Button>

      </div>

      <GoogleSignIn onRequireOTP={email => onRequireOTP?.(email, null)} />

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