import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Clock, Mail, ArrowLeft, RefreshCw } from 'lucide-react';

interface AwaitingApprovalProps {
  email: string;
  role: string;
  onBack: () => void;
}

export function AwaitingApproval({ email, role, onBack }: AwaitingApprovalProps) {
  const { t } = useTranslation();

  const getRoleLabel = (r: string) => {
    const labels: Record<string, string> = {
      tenant: 'Tenant',
      employee: 'Employee',
      landlord: 'Landlord',
    };
    return labels[r] || r;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
          <Clock className="h-10 w-10 text-warning animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold">Awaiting Approval</h2>
        <p className="text-muted-foreground mt-2">
          Your {getRoleLabel(role)} account is pending administrator review
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Account Email</p>
            <p className="font-medium">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium text-warning">Pending Review</p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="font-medium mb-2">What happens next?</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
            An administrator will review your application
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
            You'll receive an email notification once approved
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
            After approval, log in and verify with OTP
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Check Status
        </Button>
        
        <Button
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Need help? Contact support at{' '}
        <a href="mailto:support@propmanager.com" className="text-primary hover:underline">
          support@propmanager.com
        </a>
      </p>
    </div>
  );
}
