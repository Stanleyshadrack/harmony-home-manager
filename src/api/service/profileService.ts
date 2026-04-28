// services/profileService.ts

import { API_PATHS } from "../constants/constants";
import { ProfileResponse } from "../dto/ProfileResponse";
import { apiRequest } from "../https";



export const getMyProfileByRole = async (
  role: string
): Promise<ProfileResponse> => {
  switch (role) {
    case "LANDLORD":
      return apiRequest({ path: API_PATHS.MY_LANDLORD_PROFILE, method: "GET" });

    case "EMPLOYEE":
      return apiRequest({ path: API_PATHS.EMPLOYEE_PROFILE, method: "GET" });

    case "TENANT":
      return apiRequest({ path: API_PATHS.MY_TENANT_PROFILE, method: "GET" });

    default:
      return apiRequest({ path: API_PATHS.MY_USER_PROFILE, method: "GET" });
  }
};

export const updateMyProfileByRole = async (
  role: string,
  payload: any
): Promise<ProfileResponse> => {
  switch (role) {
    case "LANDLORD":
      return apiRequest({
        path: API_PATHS.MY_LANDLORD_PROFILE,
        method: "PUT",
        body: payload,
      });

    case "EMPLOYEE":
      return apiRequest({
        path: API_PATHS.EMPLOYEE_PROFILE,
        method: "PUT",
        body: payload,
      });

    case "TENANT":
      return apiRequest({
        path: API_PATHS.MY_TENANT_PROFILE,
        method: "PUT",
        body: payload,
      });

    default:
      return apiRequest({
        path: API_PATHS.MY_USER_PROFILE,
        method: "PUT",
        body: payload,
      });
  }
};