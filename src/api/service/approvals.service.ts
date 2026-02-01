import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";

export const UserApprovalsApi = {
  approve: (userId: number) =>
    apiRequest<null, void>({
      path: API_PATHS.APPROVALS(userId),
      method: "POST",
    }),

  reject: (userId: number) =>
    apiRequest<null, void>({
      path: `/api/user-approvals/${userId}/reject`,
      method: "POST",
    }),
};
