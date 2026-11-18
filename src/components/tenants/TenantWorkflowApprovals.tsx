import { useState } from "react";
import { useApprovals } from "@/hooks/useApprovals";
import { Approval } from "@/api/dto/approval.dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { tokenService } from "@/services/tokenService";

/** Review queue for the backend's tenant, lease, and document approvals. */
export function TenantWorkflowApprovals() {
  const { approvals, loading, approve, reject } = useApprovals();
  const [reasonById, setReasonById] = useState<Record<number, string>>({});
  const [workingId, setWorkingId] = useState<number | null>(null);

  const pending = approvals.filter(
    (item) => item.status === "PENDING" &&
      ["TENANT", "LEASE", "DOCUMENT"].includes(item.type)
  );

  async function decide(item: Approval, decision: "approve" | "reject") {
    const reason = reasonById[item.id]?.trim();
    if (decision === "reject" && !reason) {
      toast.error("A rejection reason is required");
      return;
    }

    setWorkingId(item.id);
    try {
      if (decision === "approve") {
        await approve(item.id);
      } else {
        await reject(item.id, reason!);
      }
      toast.success(`${item.type} ${decision === "approve" ? "approved" : "rejected"}`);
      setReasonById((existing) => ({ ...existing, [item.id]: "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not process approval");
    } finally {
      setWorkingId(null);
    }
  }

  async function previewDocument(approvalId: number) {
    const token = tokenService.getAccessToken();
    if (!token) {
      toast.error("Please log in to review documents");
      return;
    }

    setWorkingId(approvalId);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const response = await fetch(`${apiBase}/api/approvals/${approvalId}/document`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Document preview unavailable or access denied");
      }
      const contentType = response.headers.get("content-type") || "";
      if (!["application/pdf", "image/png", "image/jpeg"].some(
        (allowed) => contentType.startsWith(allowed))) {
        throw new Error("Unsupported document format");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open document");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant, Lease & Document Reviews</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review tenant onboarding, lease activation, tenant ID and lease documents.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading approvals…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending tenant workflow approvals.</p>
        ) : (
          pending.map((item) => (
            <div key={item.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {item.type === "DOCUMENT"
                    ? `${item.documentType === "ID" ? "ID" : "Lease"} document`
                    : item.type === "LEASE" ? "Lease activation" : "Tenant"}
                </Badge>
                <span className="font-medium">{item.targetName || `Record #${item.targetId}`}</span>
                {item.targetExtra && <span className="text-sm text-muted-foreground">{item.targetExtra}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.propertyNames?.join(", ") || `Property #${item.propertyId ?? "—"}`}
              </div>
              <Input
                aria-label={`Rejection reason for approval ${item.id}`}
                placeholder="Reason for rejection (required to reject)"
                value={reasonById[item.id] ?? ""}
                onChange={(event) =>
                  setReasonById((existing) => ({ ...existing, [item.id]: event.target.value }))
                }
              />
              <div className="flex flex-wrap gap-2">
                {item.type === "DOCUMENT" && (
                  <Button variant="outline" disabled={workingId !== null}
                    onClick={() => previewDocument(item.id)}>
                    View document
                  </Button>
                )}
                <Button disabled={workingId !== null} onClick={() => decide(item, "approve")}>
                  Approve
                </Button>
                <Button variant="destructive" disabled={workingId !== null}
                  onClick={() => decide(item, "reject")}>
                  Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
