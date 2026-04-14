import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
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
  Home,
} from 'lucide-react';
import { useApprovals } from '@/hooks/useApprovals';

type Props = {
  approvals: any[];
};

export function TenantApprovals({ approvals }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { approve, reject } = useApprovals();
  const { addNotification } = useInAppNotifications();
  const { sendQuickNotification } = useNotifications();

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(null);

  /* =========================
     APPROVE
  ========================= */
  const handleApprove = async (approval: any) => {
    setIsProcessing(true);
    try {
      await approve(approval.id);

      // 🔔 Notification
      if (approval.requestedByEmail) {
        addNotification({
          userId: approval.requestedByEmail,
          title: 'Tenant Approved',
          message: `${approval.targetName} has been approved.`,
          category: 'registration_approved',
          priority: 'high',
        });
      }

      toast.success("Tenant approved successfully");
    } finally {
      setIsProcessing(false);
    }
  };

  /* =========================
     REJECT (OPEN DIALOG)
  ========================= */
  const handleReject = (id: number) => {
    setSelectedApprovalId(id);
    setShowRejectDialog(true);
  };

  /* =========================
     CONFIRM REJECT
  ========================= */
  const handleRejectConfirm = async () => {
    if (!selectedApprovalId || !rejectionReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setIsProcessing(true);
    try {
      await reject(selectedApprovalId, rejectionReason);

      toast.success("Tenant rejected successfully");

      setShowRejectDialog(false);
      setSelectedApprovalId(null);
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  /* =========================
     EMPTY STATE
  ========================= */
  if (approvals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Tenant Approvals
          </CardTitle>
          <CardDescription>
            Review and approve tenant requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
            <h3 className="font-semibold mb-2">All caught up!</h3>
            <p className="text-sm text-muted-foreground">
              No pending tenant approvals
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* =========================
     MAIN UI
  ========================= */
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Tenant Approvals
            <Badge variant="secondary" className="ml-2">
              {approvals.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Review and approve tenant requests
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="p-4 border rounded-lg">
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Home className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium">
                      {approval.targetName || "Unknown"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {approval.propertyNames?.[0]} • {approval.propertyCities?.[0]}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => handleApprove(approval)}
                    disabled={isProcessing}
                  >
                    Approve
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => handleReject(approval.id)}
                    disabled={isProcessing}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* =========================
         REJECT DIALOG
      ========================= */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Tenant</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Label>Rejection Reason</Label>
            <Textarea
              placeholder="Enter reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedApprovalId(null);
                setRejectionReason('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}