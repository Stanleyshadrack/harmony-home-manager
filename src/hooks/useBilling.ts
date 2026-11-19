import { useState, useCallback, useEffect } from 'react';
import { apiRequest } from '@/api/https';
import { useAuth } from '@/contexts/AuthContext';
import type { Invoice, Payment, InvoiceFormData, PaymentFormData, WaterReadingFormData, InvoiceType, PaymentMethod } from '@/types/billing';

type ApiPayment = {
  id: number; invoiceId: number; invoiceNumber?: string; amount: number;
  method: string; transactionRef?: string; paymentDate?: string; notes?: string;
};
type ApiInvoice = {
  id: number; invoiceNumber?: string; tenantId: number; tenantName?: string;
  tenantEmail?: string; propertyName?: string; unitId: number; unitNumber?: string;
  type: string; description?: string; amount: number; amountPaid: number;
  balance: number; status: string; dueDate?: string; issuedDate?: string;
  paidDate?: string; payments?: ApiPayment[];
  lines?: {type:string;description:string;amount:number;waterReadingId?:number;periodYear?:number;periodMonth?:number}[];
  priorBalanceAtIssue?: number; billingYear?: number; billingMonth?: number;
  invoiceDisplayName?: string; paymentMethodLabel?: string; paybillNumber?: string;
  paymentAccountReference?: string; paymentSupportContact?: string; paymentInstructions?: string;
};
type UnitRow = { id: number; propertyId: number };

function mapInvoice(i: ApiInvoice, propertyIds: Map<number, number>): Invoice {
  return {
    id: i.id, invoiceNumber: i.invoiceNumber || `INV-${i.id}`,
    tenantId: i.tenantId, tenantName: i.tenantName || '',
    tenantEmail: i.tenantEmail || undefined,
    unitId: i.unitId, unitNumber: i.unitNumber || '',
    propertyId: propertyIds.get(i.unitId) ?? 0, propertyName: i.propertyName || '',
    type: (i.type || 'other').toLowerCase() as InvoiceType,
    description: i.description || '', amount: Number(i.amount || 0),
    amountPaid: Number(i.amountPaid || 0), balance: Number(i.balance || 0),
    status: (i.status || 'pending').toLowerCase() as Invoice['status'],
    dueDate: i.dueDate || '', issuedDate: i.issuedDate || '',
    paidDate: i.paidDate || undefined,
    createdAt: i.issuedDate || '', updatedAt: i.issuedDate || '',
    lines: (i.lines || []).map(line => ({ ...line, amount: Number(line.amount || 0) })),
    priorBalanceAtIssue: Number(i.priorBalanceAtIssue || 0),
    billingYear: i.billingYear, billingMonth: i.billingMonth,
    invoiceDisplayName: i.invoiceDisplayName || undefined,
    paymentMethodLabel: i.paymentMethodLabel || undefined,
    paybillNumber: i.paybillNumber || undefined,
    paymentAccountReference: i.paymentAccountReference || undefined,
    paymentSupportContact: i.paymentSupportContact || undefined,
    paymentInstructions: i.paymentInstructions || undefined,
  };
}

function mapPayment(p: ApiPayment, invoice: Invoice): Payment {
  return {
    id: p.id, invoiceId: p.invoiceId,
    invoiceNumber: p.invoiceNumber || invoice.invoiceNumber,
    tenantId: invoice.tenantId, tenantName: invoice.tenantName,
    amount: Number(p.amount || 0),
    paymentMethod: (p.method || 'bank').toLowerCase() as PaymentMethod,
    transactionRef: p.transactionRef || '',
    paymentDate: p.paymentDate || '',
    notes: p.notes, createdAt: p.paymentDate || '',
  };
}

export function useBilling() {
  const { user, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Backend /invoice/my enforces tenant, employee, landlord and admin scope.
      const [invoiceRows, units] = await Promise.all([
        apiRequest<null, ApiInvoice[]>({ path: '/api/billing/invoice/my', method: 'GET' }),
        apiRequest<null, UnitRow[]>({ path: '/api/units', method: 'GET' }),
      ]);
      const propertyIds = new Map(units.map(u => [u.id, u.propertyId]));
      const mapped = invoiceRows.map(i => mapInvoice(i, propertyIds));
      setInvoices(mapped);
      setPayments(invoiceRows.flatMap((i, n) =>
        (i.payments || []).map(p => mapPayment(p, mapped[n]))));
      setLoadError(null);
    } catch (error) {
      setInvoices([]);
      setPayments([]);
      setLoadError(error instanceof Error ? error.message : 'Unable to load billing data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setInvoices([]);
      setPayments([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }
    void reload().catch(() => { /* error exposed via loadError */ });
  }, [authLoading, user?.id, reload]);

  const createInvoice = useCallback(async (data: InvoiceFormData): Promise<Invoice> => {
    const dto = await apiRequest<object, ApiInvoice>({
      path: '/api/billing/invoice', method: 'POST',
      body: {
        tenantId: Number(data.tenantId), unitId: Number(data.unitId),
        type: data.type.toUpperCase(), amount: data.amount,
        dueDate: data.dueDate, notes: data.description,
      },
    });
    await reload();
    const unit = await apiRequest<null, UnitRow[]>({ path: '/api/units', method: 'GET' });
    return mapInvoice(dto, new Map(unit.map(u => [u.id, u.propertyId])));
  }, [reload]);

  const createWaterInvoice = useCallback(async (reading: WaterReadingFormData) => {
    // This records a water reading; billing is generated from approved readings
    // for the configured billing period. Do not create fake local invoices.
    const result = await apiRequest<object, unknown>({
      path: '/api/water-readings', method: 'POST',
      body: {
        unitId: Number(reading.unitId),
        meterId: String(reading.meterId),
        previousReading: reading.previousReading,
        currentReading: reading.currentReading,
        ratePerUnit: reading.ratePerUnit,
        readingDate: reading.readingDate,
      },
    });
    await reload();
    return result;
  }, [reload]);

  const recordPayment = useCallback(async (data: PaymentFormData): Promise<Payment> => {
    const invoice = invoices.find(i => i.id === Number(data.invoiceId));
    if (!invoice) throw new Error('Invoice not found in the active landlord account');
    const dto = await apiRequest<object, ApiPayment>({
      path: '/api/billing/payment', method: 'POST',
      body: {
        invoiceId: Number(data.invoiceId), amount: data.amount,
        method: data.paymentMethod.toUpperCase(), transactionRef: data.transactionRef,
        notes: data.notes,
      },
    });
    await reload();
    return mapPayment(dto, invoice);
  }, [invoices, reload]);

  const updateInvoice = useCallback(async (id: number, data: Partial<InvoiceFormData>) => {
    const dto = await apiRequest<object, ApiInvoice>({
      path: `/api/billing/invoice/${id}`, method: 'PUT',
      body: {
        amount: data.amount, dueDate: data.dueDate,
        type: data.type ? data.type.toUpperCase() : undefined,
      },
    });
    await reload();
    return dto;
  }, [reload]);

  const cancelInvoice = useCallback(async (id: number, _reason?: string) => {
    await apiRequest<null, string>({
      path: `/api/billing/invoice/${id}/cancel`, method: 'PATCH',
    });
    await reload();
  }, [reload]);

  const getInvoicesByStatus = useCallback((status: Invoice['status']) =>
    invoices.filter(i => i.status === status), [invoices]);
  const getPaymentsByInvoice = useCallback((invoiceId: number) =>
    payments.filter(p => p.invoiceId === invoiceId), [payments]);
  const getTotalRevenue = useCallback(() =>
    payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const getTotalOutstanding = useCallback(() =>
    invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + i.balance, 0), [invoices]);

  return {
    invoices, payments, isLoading, loadError, reload,
    createInvoice, createWaterInvoice, recordPayment,
    updateInvoice, cancelInvoice,
    getInvoicesByStatus, getPaymentsByInvoice,
    getTotalRevenue, getTotalOutstanding,
  };
}
