import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";

// ===============================
// DTOs & Interfaces
// ===============================

// ===============================
// DTOs & Interfaces
// ===============================

export interface CompanyResponse {
  id: number;
  name: string;
  
  // 🔥 New metrics fields
  numberOfLandlords: number;
  numberOfProperties: number;

  // Subscription details
  subscriptionId?: number;
  subscriptionPlan?: string;
  subscriptionStatus?: string;

  // 🔥 New subscription date fields
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;

  createdAt?: string;
}



export interface CreateCompanyRequest {
  name: string;
}

export interface UpdateCompanyRequest {
  name?: string;
}

// ===============================
// Company Service API
// ===============================

export const CompanyServiceApi = {
  /**
   * Create a new company
   */
  create: (data: CreateCompanyRequest) =>
    apiRequest<CreateCompanyRequest, CompanyResponse>({
      path: API_PATHS.CREATE_COMPANY,
      method: "POST",
      body: data,
    }),

  /**
   * Fetch all companies
   */
  getAll: () =>
    apiRequest<null, CompanyResponse[]>({
      path: API_PATHS.GET_ALL_COMPANIES,
      method: "GET",
    }),

    // NEW: Suspend Company
  suspend: (id: number) =>
    apiRequest<null, CompanyResponse>({
      path: API_PATHS.SUSPEND_COMPANY(id),
      method: "POST",
    }),

  // NEW: Activate Company
  activate: (id: number) =>
    apiRequest<null, CompanyResponse>({
      path: API_PATHS.ACTIVATE_COMPANY(id),
      method: "POST",
    }),

  /**
   * Fetch a single company by ID
   */
  getById: (id: number) =>
    apiRequest<null, CompanyResponse>({
      path: API_PATHS.GET_COMPANY_BY_ID(id),
      method: "GET",
    }),

  /**
   * Update a company
   */
  update: (id: number, data: UpdateCompanyRequest) =>
    apiRequest<UpdateCompanyRequest, CompanyResponse>({
      path: API_PATHS.UPDATE_COMPANY(id),
      method: "PUT", // Change to "PATCH" if your backend strictly uses PATCH
      body: data,
    }),

  /**
   * Delete a company
   */
  delete: (id: number) =>
    apiRequest<null, void>({
      path: API_PATHS.DELETE_COMPANY(id),
      method: "DELETE",
    }),
};