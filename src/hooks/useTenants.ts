import { useEffect, useState } from "react";
import { Tenant, TenantFormData, Lease, TenantDocument, LeaseFormData } from "@/types/tenant";
import { TenantsApi } from "@/api/service/tenantsApi";

/* =========================
   TENANTS (REAL API)
========================= */
export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    TenantsApi.getAll()
      .then(setTenants)
      .finally(() => setIsLoading(false));
  }, []);

  const addTenant = async (data: TenantFormData): Promise<Tenant> => {
    const res = await TenantsApi.create({
      userId: Number(data.userId),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      emergencyContact: data.emergencyContact,
    });

    setTenants((prev) => [...prev, res.tenant]);
    return res.tenant;
  };

  const approveTenant = async (id: string) => {
    await TenantsApi.approve(Number(id));
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "ACTIVE" } : t
      )
    );
  };

  const moveOutTenant = async (id: string) => {
    await TenantsApi.moveOut(Number(id));
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "MOVED_OUT" } : t
      )
    );
  };

  const getTenantsByStatus = (status: Tenant["status"]) =>
    tenants.filter((t) => t.status === status);

  return {
    tenants,
    isLoading,
    addTenant,
    approveTenant,
    moveOutTenant,
    getTenantsByStatus,
  };
}

/* =========================
   LEASES (MOCK — FOR NOW)
========================= */
export function useLeases(tenantId?: string) {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLeases([]); // replace when backend exists
      setIsLoading(false);
    }, 300);
  }, [tenantId]);

  const createLease = async (data: LeaseFormData): Promise<Lease> => {
    const lease: Lease = {
      id: Date.now().toString(),
      ...data,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setLeases((prev) => [...prev, lease]);
    return lease;
  };

  const signLease = async (id: string): Promise<Lease> => {
    const updated = leases.find((l) => l.id === id)!;
    updated.status = "active";
    updated.signedAt = new Date().toISOString();
    setLeases([...leases]);
    return updated;
  };

  return { leases, isLoading, createLease, signLease };
}

/* =========================
   DOCUMENTS (MOCK — FOR NOW)
========================= */
export function useTenantDocuments(tenantId: string) {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setDocuments([]); // replace when backend exists
      setIsLoading(false);
    }, 300);
  }, [tenantId]);

  const uploadDocument = async (
    file: File,
    type: TenantDocument["type"]
  ): Promise<TenantDocument> => {
    const doc: TenantDocument = {
      id: Date.now().toString(),
      tenantId,
      name: file.name,
      type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      size: file.size,
    };
    setDocuments((prev) => [...prev, doc]);
    return doc;
  };

  const deleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return { documents, isLoading, uploadDocument, deleteDocument };
}
