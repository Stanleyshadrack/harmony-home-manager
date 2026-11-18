import { useCallback } from 'react';
import { useTenants } from '@/hooks/useTenants';
import { useBilling } from '@/hooks/useBilling';
import { apiRequest } from '@/api/https';

// Server-side invoice generation handles duplicate invoices and property
// ownership. Do not create or count invoices optimistically in browser state.
export function useAutoInvoice() {
  const { tenants } = useTenants();
  const { invoices, reload } = useBilling();

  const generateMonthlyRentInvoices = useCallback(async () => {
    const now = new Date();
    const result = await apiRequest<object, { generated: number; skipped: number }>({
      path: '/api/billing/invoice/generate',
      method: 'POST',
      body: { type: 'RENT', year: now.getFullYear(), month: now.getMonth() + 1 },
    });
    await reload();
    return result;
  }, [reload]);

  const generateInvoicesForTenant = useCallback(async (tenantId: string) => {
    const now = new Date();
    const tenant = tenants.find(t => String(t.id) === tenantId);
    if (!tenant || !tenant.unitId) throw new Error('Tenant must be assigned to an active unit');
    const result = await apiRequest<object, { generated: number; skipped: number }>({
      path: '/api/billing/invoice/generate',
      method: 'POST',
      body: {
        type: 'RENT', year: now.getFullYear(), month: now.getMonth() + 1,
        unitIds: [Number(tenant.unitId)],
      },
    });
    await reload();
    return result;
  }, [tenants, reload]);

  const getTenantsWithoutInvoice = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    return tenants.filter(t => {
      if (String(t.status).toLowerCase() !== 'active' || !t.unitId) return false;
      return !invoices.some(i =>
        i.tenantId === Number(t.id) && i.type === 'rent' &&
        new Date(i.dueDate).getFullYear() === currentYear &&
        new Date(i.dueDate).getMonth() + 1 === currentMonth);
    });
  }, [tenants, invoices]);

  return { generateMonthlyRentInvoices, generateInvoicesForTenant, getTenantsWithoutInvoice };
}
