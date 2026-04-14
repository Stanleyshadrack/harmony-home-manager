import { ApprovalStatus, ApprovalType } from "@/types/ApprovalType";


export interface Approval {
  id: number;
  type: ApprovalType;

  targetId: number;

  // ✅ NEW (multi-property support)
  propertyIds?: number[];
  propertyNames?: string[];
  propertyCities?: string[];

  // 🔥 NEW (human-readable target)
  targetName?: string;
  targetExtra?: string;

  status: ApprovalStatus;
  reason?: string | null;

  requestedBy: number;
  requestedByName?: string;
  requestedByEmail?: string;

  approvedBy?: number | null;
  approvedByName?: string;
  

  createdAt: string;
  actionedAt?: string | null;
}