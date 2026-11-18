import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, KeyRound, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { apiRequest } from '@/api/https';

const resetPasswordSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const ResetPasswordForm = ({ email, onBack, onSuccess }: ResetPasswordFormProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: '',
      password: '',
      confirmPassword: '',
    },
  });

  const codeValue = watch('code');
  const passwordValue = watch('password') || '';

  const onSubmit = async (data: ResetPasswordData) => {
    setIsLoading(true);
    try {
      await apiRequest<{email:string;code:string;newPassword:string}, unknown>({
        path: "/api/auth/password-reset/confirm",
        method: "POST",
        body: { email, code: data.code, newPassword: data.password },
      });
      toast.success("Password changed. Please sign in with your new password.");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await apiRequest<{email:string}, unknown>({
        path: "/api/auth/password-reset/request",
        method: "POST",
        body: { email },
      });
      toast.success("If eligible, a reset code will be sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request a new code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">{t('auth.resetPassword', 'Reset Password')}</h2>
        <p className="text-muted-foreground text-sm mt-2">
          {t('auth.resetPasswordDescription', 'Enter the verification code sent to')} {email}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t('auth.verificationCode', 'Verification Code')}</Label>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={codeValue}
            onChange={(value) => setValue('code', value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {errors.code && (
          <p className="text-sm text-destructive text-center">{errors.code.message}</p>
        )}
        <Button
          type="button"
          variant="link"
          className="w-full text-sm"
          onClick={handleResendCode}
        >
          {t('auth.resendCode', "Didn't receive the code? Resend")}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('auth.newPassword', 'New Password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        <PasswordStrengthIndicator password={passwordValue} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('auth.confirmPassword', 'Confirm Password')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            {...register('confirmPassword')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common.loading', 'Loading...')}
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4 mr-2" />
            {t('auth.resetPassword', 'Reset Password')}
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('auth.backToLogin', 'Back to Login')}
      </Button>
    </form>
  );
};
