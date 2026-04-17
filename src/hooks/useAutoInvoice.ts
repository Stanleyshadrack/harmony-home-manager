import { useCallback } from 'react';
import { useTenants, useLeases } from '@/hooks/useTenants';
import { useMyInvoices, useCreateInvoice, useCancelInvoice, useUpdateInvoice, useGenerateInvoices} from '@/hooks/useBilling';
import { useToast } from '@/hooks/use-toast';

export function useAutoInvoice() {
  const { tenants } = useTenants();
  const { leases } = useLeases();

  const { data: invoices = [] } = useMyInvoices();
  const { mutateAsync: createInvoice } = useCreateInvoice();
  const { mutateAsync: cancelInvoiceMutate } = useCancelInvoice();
const { mutateAsync: updateInvoiceMutate } = useUpdateInvoice();
const { mutateAsync: generateInvoices } = useGenerateInvoices();


  const { toast } = useToast();


const generateInvoicesScoped = useCallback(async (payload: {
  type: 'RENT' | 'WATER';
  month: string; // ✅ NEW (YYYY-MM)
  propertyId?: string;
  unitIds?: string[];
}) => {
  try {
    // 🔥 Parse selected month
    const [year, month] = payload.month.split('-').map(Number);

    const res = await generateInvoices({
      type: payload.type,
      year,
      month,
      propertyId: payload.propertyId ? Number(payload.propertyId) : undefined,
      unitIds: payload.unitIds?.map(Number),
    });

    toast({
      title: "Generation Complete",
      description: `Generated ${res.generated}, Skipped ${res.skipped}`,
    });

    return res;

  } catch (err: any) {
    toast({
      title: "Generation Failed",
      description: err.message,
      variant: "destructive",
    });
    throw err;
  }

}, [generateInvoices, toast]);

  /* =========================
     🔁 GENERATE ALL
  ========================= */
  const generateMonthlyRentInvoices = useCallback(async () => {
    const now = new Date();

    const dueDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      5
    )
      .toISOString()
      .split('T')[0];

    const activeTenants = tenants.filter(t => t.status === 'ACTIVE');

    let generated = 0;
    let skipped = 0;

    for (const tenant of activeTenants) {
      const lease = leases.find(
        l => l.tenantId === tenant.id && l.status === 'active'
      );

      if (!lease) {
        skipped++;
        continue;
      }

      const existingInvoice = invoices.find(
        inv =>
          inv.tenantId === Number(tenant.id) &&
          inv.type === 'rent' // ✅ FIXED
      );

      if (existingInvoice) {
        skipped++;
        continue;
      }

      await createInvoice({
        tenantId:Number(tenant.id),
        unitId: Number(tenant.unitId),
        type: 'rent', // ✅ FIXED
        amount: lease.monthlyRent,
        dueDate,
      });

      generated++;
    }

    toast({
      title: 'Invoices Generated',
      description: `${generated} created, ${skipped} skipped`,
    });

    return { generated, skipped };
  }, [tenants, leases, invoices, createInvoice, toast]);

  /* =========================
     👤 SINGLE TENANT
  ========================= */
  const generateInvoicesForTenant = useCallback(
    async (tenantId: string) => {
      const tenant = tenants.find(t => t.id === tenantId);
      const lease = leases.find(
        l => l.tenantId === tenantId && l.status === 'active'
      );

      if (!tenant || !lease) {
        toast({
          title: 'Cannot generate invoice',
          description: 'Tenant or active lease not found',
          variant: 'destructive',
        });
        return null;
      }

      const now = new Date();

      const dueDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        5
      )
        .toISOString()
        .split('T')[0];

      const invoice = await createInvoice({
        tenantId: Number(tenant.id),
        unitId: Number(tenant.unitId),
        type: 'rent', // ✅ FIXED
        amount: lease.monthlyRent,
        dueDate,
      });

      toast({
        title: 'Invoice generated',
        description: `Rent invoice created for ${tenant.firstName}`,
      });

      return invoice;
    },
    [tenants, leases, createInvoice, toast]
  );

  const cancelTenantInvoice = async (invoiceId: number) => {
  await cancelInvoiceMutate(invoiceId);
};

const updateTenantInvoice = async (invoiceId: number, amount: number) => {
  await updateInvoiceMutate({
    id: invoiceId,
    payload: { amount },
  });
};

  /* =========================
     🔍 TENANTS WITHOUT INVOICE
  ========================= */
  const getTenantsWithoutInvoice = useCallback(() => {
    return tenants.filter(tenant => {
      const hasLease = leases.some(
        l => l.tenantId === tenant.id && l.status === 'active'
      );

      const hasInvoice = invoices.some(
        inv =>
          inv.tenantId === Number(tenant.id) &&
          inv.type === 'rent' // ✅ FIXED
      );

      return hasLease && !hasInvoice && tenant.status === 'ACTIVE';
    });
  }, [tenants, leases, invoices]);

  return {
    generateMonthlyRentInvoices,
    generateInvoicesForTenant,
    getTenantsWithoutInvoice,
    cancelTenantInvoice, 
  updateTenantInvoice, 
  generateInvoicesScoped,
  };
}