export type InvoiceType = 'rent' | 'water' | 'utilities' | 'late_fee' | 'other';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type PaymentMethod = 'mpesa' | 'card' | 'bank' | 'cash';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
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
  waterReading?: WaterReading;
  createdAt: string;
  updatedAt: string;
}

export interface WaterReading {
  id: string;
  unitId: string;
  meterId: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  ratePerUnit: number;
  readingDate: string;
  billingPeriod: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceFormData {
  tenantId: string;
  unitId: string;
  type: InvoiceType;
  description: string;
  amount: number;
  dueDate: string;
}

export interface WaterReadingFormData {
  unitId: string;
  meterId: string;
  previousReading: number;
  currentReading: number;
  ratePerUnit: number;
  readingDate: string;
  billingPeriod: string;
}

export interface PaymentFormData {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  paymentDate: string;
  notes?: string;
}
