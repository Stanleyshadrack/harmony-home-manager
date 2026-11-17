"use client";

import { useEffect, useState } from "react";
import { Approval } from "@/api/dto/approval.dto";
import { ApprovalsApi } from "@/api/service/approvals.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  approvalId: number | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function ApprovalDetailsModal({
  approvalId,
  open,
  onClose,
  onUpdated,
}: Props) {
  const [approval, setApproval] = useState<Approval | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || approvalId === null) return;
    let active = true;
    setApproval(null);
    setReason("");
    setLoading(true);
    ApprovalsApi.getById(approvalId)
      .then((value) => { if (active) setApproval(value); })
      .catch(() => { if (active) toast.error("Unable to load approval"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [approvalId, open]);

  async function decide(action: "approve" | "reject") {
    if (!approval) return;
    if (action === "reject" && !reason.trim()) {
      toast.error("A rejection reason is required");
      return;
    }
    setSubmitting(true);
    try {
      if (action === "approve") {
        await ApprovalsApi.approve(approval.id);
      } else {
        await ApprovalsApi.reject(approval.id, reason.trim());
      }
      toast.success(action === "approve" ? "Approved" : "Rejected");
      onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not process approval");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Approval #{approvalId}</DialogTitle>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {approval && (
          <div className="space-y-4">
            <p className="font-medium">
              {approval.type === "DOCUMENT"
                ? `${approval.documentType === "ID" ? "ID" : "Lease"} document`
                : approval.type}
              {" — "}{approval.targetName || `#${approval.targetId}`}
            </p>
            {approval.targetExtra && <p className="text-sm">{approval.targetExtra}</p>}
            <p className="text-sm">Status: {approval.status}</p>
            {approval.status === "PENDING" && (
              <>
                <Input value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for rejection" aria-label="Rejection reason" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>Close</Button>
                  <Button variant="destructive" disabled={submitting}
                    onClick={() => decide("reject")}>Reject</Button>
                  <Button disabled={submitting} onClick={() => decide("approve")}>Approve</Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
