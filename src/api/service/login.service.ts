import { API_PATHS } from "../constants/constants";
import { LoginRequest } from "../dto/loginRequest";
import { LoginResponse } from "../dto/LoginResponse";
import { apiRequest } from "../https";


export const loginService = async (payload: LoginRequest) => {
  return apiRequest<LoginRequest, LoginResponse>({
    path: API_PATHS.AUTH_LOGIN,
    method: "POST",
    body: payload,
  });
};
