import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OTPVerificationPageProps {
  email: string;
  redirectPath: string | null;
  onBack: () => void;
}

// Simulates POST /auth/mfa/verify API call
const verifyMFA = async (email: string, otp: string): Promise<{ 
  success: boolean; 
  accessToken?: string; 
  refreshToken?: string;
  error?: string;
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const storedData = localStorage.getItem(`2fa_${email}`);
  if (!storedData) {
    return { success: false, error: '2FA data not found' };
  }

  const twoFactorData = JSON.parse(storedData);
  
  // Generate expected TOTP code
  const time = Math.floor(Date.now() / 30000);
  let hash = 0;
  const secret = twoFactorData.secret;
  for (let i = 0; i < secret.length; i++) {
    hash = ((hash << 5) - hash + secret.charCodeAt(i) + time) | 0;
  }
  const expectedCode = Math.abs(hash % 1000000).toString().padStart(6, '0');
  
  if (otp === expectedCode) {
    // Simulate token generation
    const accessToken = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { success: true, accessToken, refreshToken };
  }
  
  return { success: false, error: 'Invalid verification code' };
};

// Simulates backup code verification
const verifyBackupCode = async (email: string, backupCode: string): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  remainingCodes?: number;
  error?: string;
}> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const storedData = localStorage.getItem(`2fa_${email}`);
  if (!storedData) {
    return { success: false, error: '2FA data not found' };
  }

  const twoFactorData = JSON.parse(storedData);
  const normalizedBackup = backupCode.toUpperCase().replace(/[\s-]/g, '');
  
  const codeIndex = twoFactorData.backupCodes.findIndex(
    (c: string) => c.replace('-', '') === normalizedBackup || c === normalizedBackup
  );

  if (codeIndex !== -1) {
    // Remove used backup code
    twoFactorData.backupCodes.splice(codeIndex, 1);
    localStorage.setItem(`2fa_${email}`, JSON.stringify(twoFactorData));
    
    const accessToken = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      success: true, 
      accessToken, 
      refreshToken,
      remainingCodes: twoFactorData.backupCodes.length 
    };
  }
  
  return { success: false, error: 'Invalid backup code' };
};

export function OTPVerificationPage({ email, redirectPath, onBack }: OTPVerificationPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  const handleVerify = async () => {
    setIsVerifying(true);

    try {
      let result;
      
      if (useBackupCode) {
        result = await verifyBackupCode(email, backupCode);
        if (result.success && result.remainingCodes !== undefined) {
          toast.success('Backup code verified', {
            description: `${result.remainingCodes} backup codes remaining`,
          });
        }
      } else {
        result = await verifyMFA(email, code);
        if (result.success) {
          toast.success('Verification successful');
        }
      }

      if (result.success && result.accessToken && result.refreshToken) {
        // Save tokens
        localStorage.setItem('access_token', result.accessToken);
        localStorage.setItem('refresh_token', result.refreshToken);
        
        // Navigate to dashboard or redirect path
        navigate(redirectPath || '/dashboard');
      } else if (result.error) {
        toast.error(result.error, {
          description: useBackupCode 
            ? undefined 
            : 'Please check your authenticator app and try again',
        });
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">{t('auth.twoFactorVerification', 'Two-Factor Verification')}</h2>
        <p className="text-muted-foreground text-sm mt-2">
          {useBackupCode
            ? 'Enter one of your backup codes'
            : 'Enter the code from your authenticator app'
          }
        </p>
        <p className="text-muted-foreground/70 text-xs mt-1">
          Verifying: {email}
        </p>
      </div>

      {useBackupCode ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Backup Code</Label>
            <Input
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="XXXX-XXXX"
              className="text-center font-mono tracking-widest"
            />
          </div>
        </div>
      ) : (
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
        </div>
      )}

      <Button
        onClick={handleVerify}
        className="w-full"
        disabled={(useBackupCode ? backupCode.length < 8 : code.length !== 6) || isVerifying}
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify'
        )}
      </Button>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="link"
          className="text-sm"
          onClick={() => setUseBackupCode(!useBackupCode)}
        >
          {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
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
    </div>
  );
}
