/* =====================================
   Invoice Types
===================================== */

export type InvoiceType =
  | 'rent'
  | 'water'
  | 'utilities'
  | 'late_fee'
  | 'other';

export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled';

export type PaymentMethod =
  | 'mpesa'
  | 'card'
  | 'bank'
  | 'cash';

/* =====================================
   Invoice
===================================== */

export interface Invoice {
  id: number;
  invoiceNumber: string;

  tenantId: number;
  tenantName: string;

  unitId: number;
  unitNumber: string;

  propertyId: number;
  propertyName: string;

  type: InvoiceType;

  description: string;

  amount: number;
  amountPaid: number;
  balance: number;

  status: InvoiceStatus;

  dueDate: string;
  issuedDate: string;
  paidDate?: string;

  waterReading?: WaterReadingResponse;

  createdAt: string;
  updatedAt: string;
}

/* =====================================
   Payment
===================================== */

export interface Payment {
  id: number;

  invoiceId: number;
  invoiceNumber: string;

  tenantId: number;
  tenantName: string;

  amount: number;

  paymentMethod: PaymentMethod;

  transactionRef: string;

  paymentDate: string;

  notes?: string;

  createdAt: string;
}

/* =====================================
   Forms
===================================== */

export interface InvoiceFormData {
  tenantId: number;
  unitId: number;

  type: InvoiceType;

  description: string;

  amount: number;

  dueDate: string;
}

export interface WaterReadingFormData {
  unitId: number;

  meterId: string;

  previousReading: number;
  currentReading: number;

  ratePerUnit: number;

  readingDate: string;

  billingPeriod: string;
}

export interface PaymentFormData {
  invoiceId: number;

  amount: number;

  paymentMethod: PaymentMethod;

  transactionRef: string;

  paymentDate: string;

  notes?: string;
}

/* =====================================
   API DTOs
===================================== */

export interface CreateWaterReadingRequest {
  unitId: number;

  meterId: string;

  previousReading: number;
  currentReading: number;

  ratePerUnit: number;

  readingDate: string;

  billingPeriod: string;
}

export interface WaterReadingResponse {
  id: number;

  unitId: number;

  meterId: string;

  property: string;

  previousReading: number;
  currentReading: number;

  consumption: number;

  ratePerUnit: number;

  amount: number;

  billingPeriod: string;

  readingDate: string;

  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface WaterStatsResponse {
  totalConsumption: number;

  totalRevenue: number;

  avgConsumption: number;

  totalReadings: number;

  pendingCount: number;
}

export interface MonthlyWaterStats {
  month: string;

  consumption: number;

  revenue: number;

  count: number;
}

export interface HighUsageResponse {
  unitId: number;

  property: string;

  consumption: number;

  billingPeriod: string;
}