import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";
import { Approval } from "../dto/approval.dto";

export const ApprovalsApi = {
  // GET /api/approvals
  getAll: () =>
    apiRequest<null, Approval[]>({
      path: API_PATHS.APPROVALS,
      method: "GET",
    }),

  // GET /api/approvals/{id}
  getById: (id: number) =>
    apiRequest<null, Approval>({
      path: API_PATHS.APPROVAL_BY_ID(id),
      method: "GET",
    }),

  // PUT /api/approvals/{id}/approve
  approve: (id: number) =>
    apiRequest<null, void>({
      path: API_PATHS.APPROVE_APPROVAL(id),
      method: "PUT",
    }),

  // PUT /api/approvals/{id}/reject
  reject: (id: number, reason: string) =>
    apiRequest<{ reason: string }, void>({
      path: API_PATHS.REJECT_APPROVAL(id),
      method: "PUT",
      body: { reason },
    }),
};