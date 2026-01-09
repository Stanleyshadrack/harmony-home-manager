import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingRegistrations, PendingRegistration } from '@/hooks/useRegistrations';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  UserPlus,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Clock,
  Home,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function TenantApprovals() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { registrations, approveRegistration, rejectRegistration } = usePendingRegistrations();
  const { addNotification } = useInAppNotifications();
  const { sendQuickNotification } = useNotifications();
  
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingTenantRegistrations = registrations.filter(
    r => r.requestedRole === 'tenant' && r.status === 'pending'
  );

  const handleApproveRegistration = async (registration: PendingRegistration) => {
    setIsProcessing(true);
    try {
      await approveRegistration(registration.id, user?.email || 'Landlord');
      
      // In-app notification
      addNotification({
        userId: registration.phone,
        title: 'Registration Approved!',
        message: 'Your tenant account has been approved by the landlord. You can now log in.',
        category: 'registration_approved',
        priority: 'high',
        link: '/auth',
      });

      // Send SMS/WhatsApp notification
      if (registration.phone) {
        await sendQuickNotification(
          registration.phone,
          `${registration.firstName} ${registration.lastName}`,
          'custom',
          'sms',
          {
            message: `Congratulations ${registration.firstName}! Your tenant registration has been approved. You can now log in to access your account.`
          }
        );
      }

      toast.success(`${registration.firstName} ${registration.lastName}'s tenant account approved. Notification sent.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRegistration = async () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectRegistration(selectedRegistration.id, user?.email || 'Landlord', rejectionReason);
      
      // In-app notification
      addNotification({
        userId: selectedRegistration.phone,
        title: 'Registration Rejected',
        message: `Your tenant registration was not approved. Reason: ${rejectionReason}`,
        category: 'registration_rejected',
        priority: 'high',
      });

      // Send SMS/WhatsApp notification
      if (selectedRegistration.phone) {
        await sendQuickNotification(
          selectedRegistration.phone,
          `${selectedRegistration.firstName} ${selectedRegistration.lastName}`,
          'custom',
          'sms',
          {
            message: `Hello ${selectedRegistration.firstName}, we regret to inform you that your tenant registration was not approved. Reason: ${rejectionReason}. Please contact support for more information.`
          }
        );
      }

      toast.success('Registration rejected. Notification sent.');
      setShowRejectDialog(false);
      setSelectedRegistration(null);
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  if (pendingTenantRegistrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Tenant Registrations
          </CardTitle>
          <CardDescription>
            Review and approve tenant registration requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
            <h3 className="font-semibold mb-2">All caught up!</h3>
            <p className="text-sm text-muted-foreground">
              No pending tenant registrations to review
            </p>
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
            <UserPlus className="h-5 w-5" />
            Pending Tenant Registrations
            <Badge variant="secondary" className="ml-2">
              {pendingTenantRegistrations.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Review and approve tenant registration requests. Approved or rejected tenants will receive SMS/Email notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingTenantRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {registration.firstName} {registration.lastName}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {registration.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        ID: {registration.idNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(registration.submittedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        Tenant Application
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setSelectedRegistration(registration);
                      setShowRejectDialog(true);
                    }}
                    disabled={isProcessing}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveRegistration(registration)}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedRegistration?.firstName} {selectedRegistration?.lastName}'s registration. They will be notified via SMS/Email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Incomplete documentation, unit no longer available..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedRegistration(null);
                setRejectionReason('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRegistration}
              disabled={!rejectionReason.trim() || isProcessing}
            >
              {isProcessing ? 'Sending...' : 'Reject & Notify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
