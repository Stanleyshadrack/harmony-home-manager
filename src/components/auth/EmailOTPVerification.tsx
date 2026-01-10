import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Mail, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { otpService } from '@/services/otpService';
import { tokenService, AuthTokens } from '@/services/tokenService';

interface EmailOTPVerificationProps {
  email: string;
  userId: string;
  onSuccess: (tokens: AuthTokens) => void;
  onBack: () => void;
}

export function EmailOTPVerification({ email, userId, onSuccess, onBack }: EmailOTPVerificationProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Send OTP on mount
  useEffect(() => {
    sendOTP();
  }, [email]);

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = otpService.getRemainingTime(email);
      setRemainingTime(remaining);
      
      // Allow resend after 30 seconds
      if (remaining < (5 * 60 * 1000 - 30 * 1000)) {
        setCanResend(true);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [email]);

  const sendOTP = () => {
    const { code: otpCode } = otpService.sendOTPEmail(email);
    
    // Show toast with the code for demo purposes
    toast.success('Verification code sent', {
      description: `Demo: Your code is ${otpCode}`,
      duration: 10000,
    });
    
    setCanResend(false);
  };

  const handleResend = async () => {
    setIsResending(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    sendOTP();
    setCode('');
    setIsResending(false);
  };

  const verify = async () => {
    if (code.length !== 6) return;
    
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const result = otpService.verifyOTP(email, code);

    if (result.valid) {
      // Generate tokens on successful verification
      const tokens = tokenService.generateTokens(userId);
      tokenService.storeTokens(tokens);
      
      toast.success('Verification successful', {
        description: 'You are now logged in.',
      });
      
      onSuccess(tokens);
    } else {
      toast.error(result.error || 'Invalid verification code');
      if (result.error?.includes('request a new')) {
        setCode('');
      }
    }

    setIsVerifying(false);
  };

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (code.length === 6) {
      verify();
    }
  }, [code]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">{t('auth.verifyEmail', 'Verify Your Email')}</h2>
        <p className="text-muted-foreground text-sm mt-2">
          We've sent a 6-digit code to
        </p>
        <p className="font-medium text-foreground">{email}</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isVerifying}
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

        {remainingTime > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Code expires in {formatTime(remainingTime)}
          </p>
        )}
      </div>

      <Button
        onClick={verify}
        className="w-full"
        disabled={code.length !== 6 || isVerifying}
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify & Login'
        )}
      </Button>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={!canResend || isResending}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {canResend ? 'Resend Code' : 'Resend available soon'}
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

      <p className="text-center text-xs text-muted-foreground">
        Check your spam folder if you don't see the email
      </p>
    </div>
  );
}
