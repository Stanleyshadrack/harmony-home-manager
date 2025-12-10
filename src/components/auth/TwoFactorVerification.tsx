import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TwoFactorVerificationProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

const generateTOTP = (secret: string): string => {
  const time = Math.floor(Date.now() / 30000);
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    hash = ((hash << 5) - hash + secret.charCodeAt(i) + time) | 0;
  }
  return Math.abs(hash % 1000000).toString().padStart(6, '0');
};

export function TwoFactorVerification({ email, onSuccess, onBack }: TwoFactorVerificationProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  const verify = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const storedData = localStorage.getItem(`2fa_${email}`);
    if (!storedData) {
      toast.error('2FA data not found');
      setIsVerifying(false);
      return;
    }

    const twoFactorData = JSON.parse(storedData);

    if (useBackupCode) {
      // Check backup code
      const normalizedBackup = backupCode.toUpperCase().replace(/\s/g, '');
      const codeIndex = twoFactorData.backupCodes.findIndex(
        (c: string) => c.replace('-', '') === normalizedBackup || c === normalizedBackup
      );

      if (codeIndex !== -1) {
        // Remove used backup code
        twoFactorData.backupCodes.splice(codeIndex, 1);
        localStorage.setItem(`2fa_${email}`, JSON.stringify(twoFactorData));
        toast.success('Backup code verified', {
          description: `${twoFactorData.backupCodes.length} backup codes remaining`,
        });
        onSuccess();
      } else {
        toast.error('Invalid backup code');
      }
    } else {
      // Check TOTP code
      const expectedCode = generateTOTP(twoFactorData.secret);
      
      if (code === expectedCode) {
        toast.success('Verification successful');
        onSuccess();
      } else {
        toast.error('Invalid verification code', {
          description: 'Please check your authenticator app and try again',
        });
      }
    }

    setIsVerifying(false);
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
        onClick={verify}
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
