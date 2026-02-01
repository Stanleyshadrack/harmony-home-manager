// src/api/service/setPasswordApi.ts
import { apiRequest } from "../https";
import { SetPasswordRequest } from "../dto/SetPasswordRequest";
import { API_PATHS } from "../constants/constants";

export const setPasswordService = (data: SetPasswordRequest) =>
  apiRequest<SetPasswordRequest, { message: string }>({
    path: API_PATHS.AUTH_SET_PASSWORD,
    method: "POST",
    body: data,
  });
