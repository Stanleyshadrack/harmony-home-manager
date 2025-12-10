import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
  onCodeSent: (email: string) => void;
}

export const ForgotPasswordForm = ({ onBack, onCodeSent }: ForgotPasswordFormProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    
    // Simulate sending reset code
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a mock verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in localStorage for demo purposes
    const resetData = {
      email: data.email,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    localStorage.setItem('passwordResetRequest', JSON.stringify(resetData));
    
    setIsLoading(false);
    toast.success(`Verification code sent to ${data.email}`, {
      description: `Demo code: ${code} (in production, this would be sent via email)`,
      duration: 10000,
    });
    
    onCodeSent(data.email);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">{t('auth.forgotPassword', 'Forgot Password')}</h2>
        <p className="text-muted-foreground text-sm mt-2">
          {t('auth.forgotPasswordDescription', "Enter your email and we'll send you a verification code")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
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
            <Mail className="h-4 w-4 mr-2" />
            {t('auth.sendCode', 'Send Verification Code')}
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
