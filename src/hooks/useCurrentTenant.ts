import { useEffect, useState } from "react";
import { TenantsApi } from "@/api/service/tenantsApi";
import { Tenant } from "@/types/tenant";

export function useCurrentTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    TenantsApi.getMe()
      .then(setTenant)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return { tenant, isLoading };
}