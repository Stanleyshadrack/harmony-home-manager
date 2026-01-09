import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, UserPlus, Info } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onEmailVerification?: (email: string) => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Invitation Required</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              To create an account, you need an invitation from a Super Admin or Landlord.
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 text-left">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>How it works:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Request an invitation from your property manager</li>
                <li>You'll receive an email with an onboarding link</li>
                <li>Complete the registration form</li>
                <li>Wait for account approval</li>
              </ol>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Check your email if you've been invited</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')}{' '}
        <Button
          type="button"
          variant="link"
          className="px-0 font-semibold text-primary"
          onClick={onSwitchToLogin}
        >
          {t('auth.login')}
        </Button>
      </p>
    </div>
  );
}