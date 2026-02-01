import { apiRequest } from "@/api/https";
import { API_PATHS } from "@/api/constants/constants";
import { CreateTenantResponse } from "../dto/tenantResponse";
import { CreateTenantRequest } from "../dto/tenantRequest";
import { Tenant } from "@/types/tenant";

export const TenantsApi = {
  create: (data: CreateTenantRequest) =>
    apiRequest<CreateTenantRequest, CreateTenantResponse>({
      path: API_PATHS.TENANTS,
      method: "POST",
      body: data,
    }),

  getAll: () =>
    apiRequest<null, Tenant[]>({
      path: API_PATHS.TENANTS,
      method: "GET",
    }),

  getById: (id: number) =>
    apiRequest<null, Tenant>({
      path: `${API_PATHS.TENANTS}/${id}`,
      method: "GET",
    }),

  getMe: () =>
    apiRequest<null, Tenant>({
      path: `${API_PATHS.TENANTS}/me`,
      method: "GET",
    }),

  approve: (id: number) =>
    apiRequest<null, void>({
      path: API_PATHS.APPROVE_TENANT(id),
      method: "PUT",
    }),

  assignUnit: (tenantId: number, unitId: number) =>
    apiRequest<null, void>({
      path: API_PATHS.ASSIGN_TENANT_UNIT(tenantId, unitId),
      method: "PUT",
    }),

  moveOut: (id: number) =>
    apiRequest<null, void>({
      path: API_PATHS.MOVE_OUT_TENANT(id),
      method: "PUT",
    }),
};

