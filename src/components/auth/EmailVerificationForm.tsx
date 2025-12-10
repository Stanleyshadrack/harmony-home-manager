import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface EmailVerificationFormProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const EmailVerificationForm = ({ email, onBack, onSuccess }: EmailVerificationFormProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Show the verification code in a toast for demo purposes
    const storedData = localStorage.getItem('emailVerificationPending');
    if (storedData) {
      const data = JSON.parse(storedData);
      if (data.email === email) {
        toast.info(`Verification code for ${email}`, {
          description: `Demo code: ${data.code}`,
          duration: 15000,
        });
      }
    }
  }, [email]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const storedData = localStorage.getItem('emailVerificationPending');
    if (!storedData) {
      setIsLoading(false);
      toast.error('No verification request found. Please register again.');
      onBack();
      return;
    }

    const verificationData = JSON.parse(storedData);
    
    if (verificationData.email !== email) {
      setIsLoading(false);
      toast.error('Email mismatch. Please try again.');
      return;
    }

    if (verificationData.code !== code) {
      setIsLoading(false);
      toast.error('Invalid verification code. Please try again.');
      return;
    }

    if (Date.now() > verificationData.expiresAt) {
      setIsLoading(false);
      toast.error('Verification code has expired. Please register again.');
      localStorage.removeItem('emailVerificationPending');
      onBack();
      return;
    }

    // Mark email as verified in pending registrations
    const registrations = JSON.parse(localStorage.getItem('pendingRegistrations') || '[]');
    const updatedRegistrations = registrations.map((reg: any) => {
      if (reg.email === email) {
        return { ...reg, emailVerified: true };
      }
      return reg;
    });
    localStorage.setItem('pendingRegistrations', JSON.stringify(updatedRegistrations));
    
    // Clean up
    localStorage.removeItem('emailVerificationPending');
    
    setIsLoading(false);
    setIsVerified(true);
    
    toast.success('Email verified successfully!', {
      description: 'Your account is now pending admin approval.',
    });

    // Auto-redirect after showing success
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  const handleResendCode = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationData = {
      email,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    localStorage.setItem('emailVerificationPending', JSON.stringify(verificationData));
    
    toast.success('New verification code sent!', {
      description: `Demo code: ${code}`,
      duration: 15000,
    });
  };

  if (isVerified) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
          {t('auth.emailVerified', 'Email Verified!')}
        </h2>
        <p className="text-muted-foreground">
          {t('auth.accountPendingApproval', 'Your account is pending admin approval. You will be notified once approved.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">{t('auth.verifyEmail', 'Verify Your Email')}</h2>
        <p className="text-muted-foreground text-sm mt-2">
          {t('auth.verificationCodeSent', "We've sent a verification code to")}
        </p>
        <p className="font-medium text-primary">{email}</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
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

        <Button
          type="button"
          variant="link"
          className="w-full text-sm"
          onClick={handleResendCode}
        >
          {t('auth.resendCode', "Didn't receive the code? Resend")}
        </Button>
      </div>

      <Button 
        className="w-full" 
        onClick={handleVerify}
        disabled={isLoading || code.length !== 6}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common.loading', 'Verifying...')}
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('auth.verifyEmail', 'Verify Email')}
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
    </div>
  );
};
