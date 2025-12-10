import { useState, useCallback } from 'react';
import type { Invoice, Payment, WaterReading, InvoiceFormData, PaymentFormData, WaterReadingFormData } from '@/types/billing';

// Mock data for development
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    tenantId: 't1',
    tenantName: 'John Doe',
    unitId: 'u1',
    unitNumber: 'A101',
    propertyId: 'p1',
    propertyName: 'Sunrise Apartments',
    type: 'rent',
    description: 'Monthly Rent - January 2024',
    amount: 1200,
    amountPaid: 1200,
    balance: 0,
    status: 'paid',
    dueDate: '2024-01-05',
    issuedDate: '2024-01-01',
    paidDate: '2024-01-03',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    tenantId: 't1',
    tenantName: 'John Doe',
    unitId: 'u1',
    unitNumber: 'A101',
    propertyId: 'p1',
    propertyName: 'Sunrise Apartments',
    type: 'water',
    description: 'Water Bill - January 2024',
    amount: 45.50,
    amountPaid: 0,
    balance: 45.50,
    status: 'pending',
    dueDate: '2024-01-15',
    issuedDate: '2024-01-10',
    waterReading: {
      id: 'wr1',
      unitId: 'u1',
      meterId: 'WM-001',
      previousReading: 1250,
      currentReading: 1295,
      consumption: 45,
      ratePerUnit: 1.01,
      readingDate: '2024-01-08',
      billingPeriod: 'January 2024',
    },
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    tenantId: 't2',
    tenantName: 'Jane Smith',
    unitId: 'u2',
    unitNumber: 'B202',
    propertyId: 'p1',
    propertyName: 'Sunrise Apartments',
    type: 'rent',
    description: 'Monthly Rent - January 2024',
    amount: 1500,
    amountPaid: 750,
    balance: 750,
    status: 'partial',
    dueDate: '2024-01-05',
    issuedDate: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-06T00:00:00Z',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    tenantId: 't3',
    tenantName: 'Mike Johnson',
    unitId: 'u3',
    unitNumber: 'C303',
    propertyId: 'p2',
    propertyName: 'Ocean View Towers',
    type: 'rent',
    description: 'Monthly Rent - January 2024',
    amount: 1800,
    amountPaid: 0,
    balance: 1800,
    status: 'overdue',
    dueDate: '2024-01-05',
    issuedDate: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockPayments: Payment[] = [
  {
    id: 'pay1',
    invoiceId: '1',
    invoiceNumber: 'INV-2024-001',
    tenantId: 't1',
    tenantName: 'John Doe',
    amount: 1200,
    paymentMethod: 'mpesa',
    transactionRef: 'MPE123456789',
    paymentDate: '2024-01-03',
    createdAt: '2024-01-03T10:30:00Z',
  },
  {
    id: 'pay2',
    invoiceId: '3',
    invoiceNumber: 'INV-2024-003',
    tenantId: 't2',
    tenantName: 'Jane Smith',
    amount: 750,
    paymentMethod: 'bank',
    transactionRef: 'BNK987654321',
    paymentDate: '2024-01-06',
    notes: 'Partial payment - balance to follow',
    createdAt: '2024-01-06T14:00:00Z',
  },
];

export function useBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [isLoading, setIsLoading] = useState(false);

  const createInvoice = useCallback((data: InvoiceFormData) => {
    setIsLoading(true);
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      tenantId: data.tenantId,
      tenantName: 'New Tenant',
      unitId: data.unitId,
      unitNumber: 'A101',
      propertyId: 'p1',
      propertyName: 'Sunrise Apartments',
      type: data.type,
      description: data.description,
      amount: data.amount,
      amountPaid: 0,
      balance: data.amount,
      status: 'pending',
      dueDate: data.dueDate,
      issuedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInvoices((prev) => [...prev, newInvoice]);
    setIsLoading(false);
    return newInvoice;
  }, [invoices.length]);

  const createWaterInvoice = useCallback((reading: WaterReadingFormData, tenantId: string, tenantName: string, propertyName: string, unitNumber: string) => {
    setIsLoading(true);
    const consumption = reading.currentReading - reading.previousReading;
    const amount = consumption * reading.ratePerUnit;
    
    const waterReading: WaterReading = {
      id: `wr-${Date.now()}`,
      unitId: reading.unitId,
      meterId: reading.meterId,
      previousReading: reading.previousReading,
      currentReading: reading.currentReading,
      consumption,
      ratePerUnit: reading.ratePerUnit,
      readingDate: reading.readingDate,
      billingPeriod: reading.billingPeriod,
    };

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      tenantId,
      tenantName,
      unitId: reading.unitId,
      unitNumber,
      propertyId: 'p1',
      propertyName,
      type: 'water',
      description: `Water Bill - ${reading.billingPeriod}`,
      amount,
      amountPaid: 0,
      balance: amount,
      status: 'pending',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      issuedDate: new Date().toISOString().split('T')[0],
      waterReading,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setInvoices((prev) => [...prev, newInvoice]);
    setIsLoading(false);
    return newInvoice;
  }, [invoices.length]);

  const recordPayment = useCallback((data: PaymentFormData) => {
    setIsLoading(true);
    const invoice = invoices.find((inv) => inv.id === data.invoiceId);
    if (!invoice) {
      setIsLoading(false);
      throw new Error('Invoice not found');
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: data.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      tenantId: invoice.tenantId,
      tenantName: invoice.tenantName,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionRef: data.transactionRef,
      paymentDate: data.paymentDate,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [...prev, newPayment]);

    // Update invoice
    const newAmountPaid = invoice.amountPaid + data.amount;
    const newBalance = invoice.amount - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'paid' : 'partial';

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === data.invoiceId
          ? {
              ...inv,
              amountPaid: newAmountPaid,
              balance: Math.max(0, newBalance),
              status: newStatus,
              paidDate: newStatus === 'paid' ? data.paymentDate : undefined,
              updatedAt: new Date().toISOString(),
            }
          : inv
      )
    );

    setIsLoading(false);
    return newPayment;
  }, [invoices]);

  const getInvoicesByStatus = useCallback((status: Invoice['status']) => {
    return invoices.filter((inv) => inv.status === status);
  }, [invoices]);

  const getPaymentsByInvoice = useCallback((invoiceId: string) => {
    return payments.filter((pay) => pay.invoiceId === invoiceId);
  }, [payments]);

  const getTotalRevenue = useCallback(() => {
    return payments.reduce((sum, pay) => sum + pay.amount, 0);
  }, [payments]);

  const getTotalOutstanding = useCallback(() => {
    return invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.balance, 0);
  }, [invoices]);

  return {
    invoices,
    payments,
    isLoading,
    createInvoice,
    createWaterInvoice,
    recordPayment,
    getInvoicesByStatus,
    getPaymentsByInvoice,
    getTotalRevenue,
    getTotalOutstanding,
  };
}
