import { Invoice, InvoiceType, Payment, PaymentMethod, PaymentResponse } from "@/types/billing";
import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";



const mapPayment = (p: any): Payment => ({
  id: p.id,
  amount: Number(p.amount),
 method: (p.method?.toLowerCase() ?? 'cash') as PaymentMethod,
 invoiceId: String(p.invoiceId),
  transactionRef: p.transactionRef,
  paymentDate: p.paymentDate,
  notes: p.notes,
});

const mapInvoice = (inv: any): Invoice => ({
  id: Number(inv.id),

  invoiceNumber: inv.invoiceNumber,

  tenantId: Number(inv.tenantId),
  tenantName: inv.tenantName,

  email: inv.email,
  propertyName: inv.propertyName, // ✅ fixed (was propertyNames)

  issuedDate: inv.issuedDate,

  unitId: Number(inv.unitId),
  unitNumber: inv.unitNumber,

  type: inv.type?.toLowerCase() as InvoiceType, // ✅ safe cast

  description: inv.description,

  amount: Number(inv.amount),
  amountPaid: Number(inv.amountPaid),
  balance: Number(inv.balance),

  status: inv.status,

  dueDate: inv.dueDate,

  paidDate: inv.paidDate ?? undefined,

  // ✅ FULL water reading (no trimming anymore)
  waterReading: inv.waterReading
    ? {
        id: inv.waterReading.id,
        unitId: inv.waterReading.unitId,
        meterId: inv.waterReading.meterId,
        property: inv.waterReading.property,

        previousReading: Number(inv.waterReading.previousReading),
        currentReading: Number(inv.waterReading.currentReading),

        consumption: Number(inv.waterReading.consumption),

        ratePerUnit: Number(inv.waterReading.ratePerUnit),
        amount: Number(inv.waterReading.amount),

        billingPeriod: inv.waterReading.billingPeriod,
        readingDate: inv.waterReading.readingDate,

        status: inv.waterReading.status,
      }
    : undefined,
  payments: inv.payments?.map(mapPayment) ?? [],
});

/* =========================
   CREATE INVOICE
========================= */

export const createInvoice = async (payload: {
  tenantId: number;
  unitId: number;
  type: InvoiceType;
  amount: number;
  dueDate: string;
}): Promise<Invoice> => {
  const resp = await apiRequest<typeof payload, any>({
    path: API_PATHS.CREATE_INVOICE, // ✅ FIXED
    method: "POST",
    body: payload,
  });

  return mapInvoice(resp);
};

/* =========================
   UPDATE INVOICE
========================= */

export const updateInvoice = async (
  id: number,
  payload: {
    amount?: number;
    dueDate?: string;
    type?: InvoiceType;
  }
): Promise<Invoice> => {
  const resp = await apiRequest<typeof payload, any>({
    path: API_PATHS.UPDATE_INVOICE(id),
    method: "PUT",
    body: payload,
  });

  return mapInvoice(resp);
};

/* =========================
   CANCEL INVOICE
========================= */

export const cancelInvoice = async (id: number): Promise<string> => {
  return apiRequest<null, string>({
    path: API_PATHS.CANCEL_INVOICE(id),
    method: "PATCH",
  });
};

/* =========================
   CREATE WATER INVOICE
========================= */

export const createWaterInvoice = async (
  payload: any
): Promise<Invoice> => {
  const resp = await apiRequest<any, any>({
    path: API_PATHS.CREATE_WATER_INVOICE,
    method: "POST",
    body: payload,
  });

  return mapInvoice(resp);
};

/* =========================
   GET SINGLE INVOICE
========================= */

export const getInvoice = async (id: number): Promise<Invoice> => {
  const resp = await apiRequest<null, any>({
    path: API_PATHS.INVOICE_BY_ID(id),
    method: "GET",
  });

  return mapInvoice(resp);
};

/* =========================
   MY INVOICES
========================= */

export const getMyInvoices = async (): Promise<Invoice[]> => {
  const resp = await apiRequest<null, any[]>({
    path: API_PATHS.MY_INVOICES,
    method: "GET",
  });

  return resp.map(mapInvoice);
};

/* =========================
   RECORD PAYMENT
========================= */

export const recordPayment = async (payload: {
  invoiceId: number;
  amount: number;
  method: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}): Promise<Payment> =>  {
  const resp = await apiRequest<typeof payload, any>({
    path: API_PATHS.RECORD_PAYMENT, // ✅ FIXED
    method: "POST",
    body: payload,
  });

  return mapPayment(resp);
};

/* =========================
   MPESA PAYMENT
========================= */

export const payWithMpesa = async (
  invoiceId: number,
  phone: string,
  amount: number
): Promise<PaymentResponse> => {
  return apiRequest<null, PaymentResponse>({
    path: API_PATHS.MPESA_PAY,
    method: "POST",
    params: { invoiceId, phone, amount },
  });
};

/* =========================
   PAYMENT STATUS (NEW 🔥)
========================= */

export const getPaymentStatus = async (
  checkoutId: string
): Promise<PaymentResponse> => {
  return apiRequest<null, PaymentResponse>({
    path: API_PATHS.PAYMENT_STATUS(checkoutId),
    method: "GET",
  });
};