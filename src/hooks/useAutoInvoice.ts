import { useCallback } from 'react';
import { useTenants, useLeases } from '@/hooks/useTenants';
import { useBilling } from '@/hooks/useBilling';
import { useToast } from '@/hooks/use-toast';

export function useAutoInvoice() {
  const { tenants } = useTenants();
  const { leases } = useLeases();
  const { invoices, createInvoice } = useBilling();
  const { toast } = useToast();

  const generateMonthlyRentInvoices = useCallback(() => {
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0];
    
    // Get active tenants with active leases
    const activeTenants = tenants.filter(t => t.status === 'active');
    let generated = 0;
    let skipped = 0;

    activeTenants.forEach(tenant => {
      const lease = leases.find(l => l.tenantId === tenant.id && l.status === 'active');
      
      if (!lease) {
        skipped++;
        return;
      }

      // Check if invoice already exists for this month
      const existingInvoice = invoices.find(
        inv => inv.tenantId === tenant.id && 
               inv.type === 'rent' && 
               inv.description.includes(currentMonth)
      );

      if (existingInvoice) {
        skipped++;
        return;
      }

      // Create rent invoice
      createInvoice({
        tenantId: tenant.id,
        unitId: tenant.unitId,
        type: 'rent',
        description: `Monthly Rent - ${currentMonth}`,
        amount: lease.monthlyRent,
        dueDate,
      });
      generated++;
    });

    return { generated, skipped };
  }, [tenants, leases, invoices, createInvoice]);

  const generateInvoicesForTenant = useCallback((tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    const lease = leases.find(l => l.tenantId === tenantId && l.status === 'active');

    if (!tenant || !lease) {
      toast({
        title: 'Cannot generate invoice',
        description: 'Tenant or active lease not found',
        variant: 'destructive',
      });
      return null;
    }

    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0];

    const invoice = createInvoice({
      tenantId: tenant.id,
      unitId: tenant.unitId,
      type: 'rent',
      description: `Monthly Rent - ${currentMonth}`,
      amount: lease.monthlyRent,
      dueDate,
    });

    toast({
      title: 'Invoice generated',
      description: `Rent invoice created for ${tenant.firstName} ${tenant.lastName}`,
    });

    return invoice;
  }, [tenants, leases, createInvoice, toast]);

  const getTenantsWithoutInvoice = useCallback(() => {
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    return tenants.filter(tenant => {
      const hasLease = leases.some(l => l.tenantId === tenant.id && l.status === 'active');
      const hasInvoice = invoices.some(
        inv => inv.tenantId === tenant.id && 
               inv.type === 'rent' && 
               inv.description.includes(currentMonth)
      );
      return hasLease && !hasInvoice && tenant.status === 'active';
    });
  }, [tenants, leases, invoices]);

  return {
    generateMonthlyRentInvoices,
    generateInvoicesForTenant,
    getTenantsWithoutInvoice,
  };
}
