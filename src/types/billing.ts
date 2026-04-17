/* =====================================
   Invoice Types
===================================== */

export type InvoiceType =
  | 'rent'
  | 'water'
  | 'utilities'
  | 'late_fee'
  | 'other';

  export type PaymentStatus =
  | 'pending'
  | 'success'
  | 'failed';

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

  waterReading?: WaterReadingResponse;

  tenantEmail: string;
  propertyName:string;

  issuedDate:string;

  unitId: number;
  unitNumber: string;

  type: InvoiceType;

  description: string;

  amount: number;
  amountPaid: number;
  balance: number;

  status: InvoiceStatus;

  dueDate: string;

    paidDate?: string;

  payments?: Payment[];
}
/* =====================================
   Payment
===================================== */

export interface Payment {
  invoiceId: number;
  id: number;

  amount: number;

  method: PaymentMethod;

  status: PaymentStatus; 


  checkoutRequestId?: string;

  failureReason?: string;
  invoiceNumber: string;

  transactionRef: string;

  paymentDate: string;

  notes?: string;
}

/* =====================================
   Forms
===================================== */

export interface InvoiceFormData {
  tenantId: string;
  unitId: string;

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
    transactionRef: string; 
  paymentDate: string; 
  invoiceId: string; 
  amount: number;
  paymentMethod: PaymentMethod;

  phoneNumber?: string; 
  reference?: string;  

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

export interface PaymentResponse {
  id?: number;
  invoiceId?: number;

  amount?: number;

   invoiceNumber?: string;

  method?: string;

  failureReason?: string;

  status?: string; // pending | success | failed

  transactionRef?: string;

  checkoutRequestId?: string;

  paymentDate?: string;

  message?: string;
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