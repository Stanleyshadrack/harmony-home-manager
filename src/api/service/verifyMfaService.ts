import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";
import { VerifyMfaResponse } from "../dto/VerifyMfaResponse";
import { VerifyMfaRequest } from "../dto/VerifyMfaRequest";

export const verifyMfaService = async (payload: VerifyMfaRequest) => {
  return apiRequest<VerifyMfaRequest, VerifyMfaResponse>({
    path: API_PATHS.AUTH_VERIFY_MFA,
    method: "POST",
    body: payload,
  });
};
