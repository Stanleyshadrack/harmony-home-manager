import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Shield, ShieldCheck, ShieldOff, Smartphone, Copy, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TwoFactorData {
  enabled: boolean;
  secret: string;
  backupCodes: string[];
  enabledAt?: number;
}

const generateSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
};

const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                 Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(code);
  }
  return codes;
};

const generateTOTP = (secret: string): string => {
  // Simplified TOTP simulation - in production this would use actual TOTP algorithm
  const time = Math.floor(Date.now() / 30000);
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    hash = ((hash << 5) - hash + secret.charCodeAt(i) + time) | 0;
  }
  return Math.abs(hash % 1000000).toString().padStart(6, '0');
};

export function TwoFactorSetup() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const [setupMode, setSetupMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [pendingSecret, setPendingSecret] = useState('');
  const [pendingBackupCodes, setPendingBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [currentTOTP, setCurrentTOTP] = useState('');

  useEffect(() => {
    // Load 2FA data from localStorage
    const stored = localStorage.getItem(`2fa_${user?.email}`);
    if (stored) {
      setTwoFactorData(JSON.parse(stored));
    }
  }, [user?.email]);

  useEffect(() => {
    // Update TOTP code every second for demo purposes
    if (setupMode && pendingSecret) {
      const interval = setInterval(() => {
        setCurrentTOTP(generateTOTP(pendingSecret));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [setupMode, pendingSecret]);

  const startSetup = () => {
    const secret = generateSecret();
    const backupCodes = generateBackupCodes();
    setPendingSecret(secret);
    setPendingBackupCodes(backupCodes);
    setCurrentTOTP(generateTOTP(secret));
    setSetupMode(true);
    setVerificationCode('');
  };

  const cancelSetup = () => {
    setSetupMode(false);
    setPendingSecret('');
    setPendingBackupCodes([]);
    setVerificationCode('');
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(pendingSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    toast.success('Secret copied to clipboard');
  };

  const verifyAndEnable = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const expectedCode = generateTOTP(pendingSecret);
    
    if (verificationCode === expectedCode || verificationCode === currentTOTP) {
      const data: TwoFactorData = {
        enabled: true,
        secret: pendingSecret,
        backupCodes: pendingBackupCodes,
        enabledAt: Date.now(),
      };
      localStorage.setItem(`2fa_${user?.email}`, JSON.stringify(data));
      setTwoFactorData(data);
      setSetupMode(false);
      setShowBackupCodes(true);
      toast.success('Two-factor authentication enabled!', {
        description: 'Your account is now more secure.',
      });
    } else {
      toast.error('Invalid verification code', {
        description: `Demo: Use the code shown above (${currentTOTP})`,
      });
    }
    setIsVerifying(false);
  };

  const disable2FA = () => {
    localStorage.removeItem(`2fa_${user?.email}`);
    setTwoFactorData(null);
    setShowDisableDialog(false);
    toast.success('Two-factor authentication disabled');
  };

  if (showBackupCodes && twoFactorData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            Backup Codes
          </CardTitle>
          <CardDescription>
            Save these codes in a safe place. You can use them to sign in if you lose access to your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
            {twoFactorData.backupCodes.map((code, index) => (
              <div key={index} className="p-2 bg-background rounded text-center">
                {code}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Each code can only be used once. Keep them private and secure.
          </p>
          <Button onClick={() => setShowBackupCodes(false)} className="w-full">
            I've saved my backup codes
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (setupMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Set Up Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Use an authenticator app like Google Authenticator or Authy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Placeholder */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
              <div className="text-center p-4">
                <Shield className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  QR Code would appear here in production
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code with your authenticator app, or enter the secret key manually:
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Secret Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm tracking-widest text-center">
                {pendingSecret.match(/.{1,4}/g)?.join(' ')}
              </code>
              <Button variant="outline" size="icon" onClick={copySecret}>
                {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Demo TOTP Display */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              Demo: Current verification code (updates every 30s)
            </p>
            <p className="text-3xl font-mono font-bold text-center text-primary tracking-widest">
              {currentTOTP}
            </p>
          </div>

          {/* Verification */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter verification code</label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
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

          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelSetup} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={verifyAndEnable} 
              className="flex-1"
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Enable 2FA'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('settings.security')}
          </CardTitle>
          <CardDescription>
            Protect your account with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {twoFactorData?.enabled ? (
                <ShieldCheck className="h-8 w-8 text-success" />
              ) : (
                <ShieldOff className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorData?.enabled 
                    ? 'Your account is protected with 2FA'
                    : 'Add an extra layer of security to your account'
                  }
                </p>
              </div>
            </div>
            <Badge variant={twoFactorData?.enabled ? 'default' : 'secondary'}>
              {twoFactorData?.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          {twoFactorData?.enabled ? (
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowBackupCodes(true)}
              >
                View Backup Codes
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowDisableDialog(true)}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable 2FA
              </Button>
            </div>
          ) : (
            <Button onClick={startSetup} className="w-full">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Enable Two-Factor Authentication
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the extra layer of security from your account. 
              You can always enable it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={disable2FA} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
