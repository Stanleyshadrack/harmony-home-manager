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

const resetPasswordSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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

  const onSubmit = async (data: ResetPasswordData) => {
    setIsLoading(true);
    
    // Check the stored reset request
    const storedData = localStorage.getItem('passwordResetRequest');
    if (!storedData) {
      setIsLoading(false);
      toast.error('No password reset request found. Please try again.');
      onBack();
      return;
    }

    const resetRequest = JSON.parse(storedData);
    
    // Verify the code and email
    if (resetRequest.email !== email) {
      setIsLoading(false);
      toast.error('Email mismatch. Please try again.');
      return;
    }

    if (resetRequest.code !== data.code) {
      setIsLoading(false);
      toast.error('Invalid verification code');
      return;
    }

    if (Date.now() > resetRequest.expiresAt) {
      setIsLoading(false);
      toast.error('Verification code has expired. Please request a new one.');
      localStorage.removeItem('passwordResetRequest');
      onBack();
      return;
    }

    // Simulate password reset
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the demo user's password in localStorage
    const registrations = JSON.parse(localStorage.getItem('pendingRegistrations') || '[]');
    const updatedRegistrations = registrations.map((reg: any) => {
      if (reg.email === email) {
        return { ...reg, password: data.password };
      }
      return reg;
    });
    localStorage.setItem('pendingRegistrations', JSON.stringify(updatedRegistrations));
    
    // Clean up
    localStorage.removeItem('passwordResetRequest');
    
    setIsLoading(false);
    toast.success('Password reset successfully!', {
      description: 'You can now log in with your new password.',
    });
    
    onSuccess();
  };

  const handleResendCode = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const resetData = {
      email,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    localStorage.setItem('passwordResetRequest', JSON.stringify(resetData));
    
    toast.success('New verification code sent!', {
      description: `Demo code: ${code}`,
      duration: 10000,
    });
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
