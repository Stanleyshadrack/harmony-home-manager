// dto/tenantRequest.ts
export interface CreateTenantRequest {
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  emergencyContact?: string;
}
