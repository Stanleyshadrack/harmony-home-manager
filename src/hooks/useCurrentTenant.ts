import { useEffect, useState } from "react";
import { TenantsApi } from "@/api/service/tenantsApi";
import { Tenant } from "@/types/tenant";
import { useAuth } from "@/contexts/AuthContext";

export function useCurrentTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth(); // 👈 contains role from JWT

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    let request;

    switch (user.role) {
      case "tenant":
        request = TenantsApi.getMe().then(setTenant);
        break;

      case "super_admin":
        request = TenantsApi.getAll().then(setTenants);
        break;

      // case "landlord":
      //   request = TenantsApi.getLandlordTenants().then(setTenants);
      //   break;

      // case "employee":
      //   request = TenantsApi.getEmployeeTenants().then(setTenants);
      //   break;

      default:
  request = Promise.resolve(); 
    }

    request
      .catch(console.error)
      .finally(() => setIsLoading(false));

  }, [user]);

  return {
    tenant,     // for TENANT
    tenants,    // for others
    isLoading,
    role: user?.role,
  };
}