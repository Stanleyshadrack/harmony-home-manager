import { API_PATHS } from "../constants/constants";
import { ResendOtpRequest } from "../dto/resendOtpRequest";
import { ResendOtpResponse } from "../dto/resendOtpResponse";
import { apiRequest } from "../https";

export const resendOtpService = async (payload: ResendOtpRequest) => {
  return apiRequest<ResendOtpRequest, ResendOtpResponse>({
    path: API_PATHS.AUTH_RESEND_OTP,
    method: "POST",
    body: payload,
  });
};
