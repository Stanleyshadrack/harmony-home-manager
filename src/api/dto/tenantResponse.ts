import { Lease, Tenant } from "@/types/tenant";

export interface CreateTenantResponse {
  tenant: Tenant;
  lease?: Lease;
}
