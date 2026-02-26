import { ApprovalStatus, ApprovalType } from "@/types/ApprovalType";


export interface Approval {
  id: number;

  type: ApprovalType;

  targetId: number;
  propertyId?: number | null;

  status: ApprovalStatus;

  reason?: string | null;

  requestedBy: number;
  approvedBy?: number | null;

  createdAt: string;      // ISO date
  actionedAt?: string | null;
}