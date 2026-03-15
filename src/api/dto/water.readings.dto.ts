/* =====================================
   Water Reading DTOs
===================================== */

export interface CreateWaterReadingRequest {
  unitId: number;
  meterId: string;

  currentReading: number;

  ratePerUnit: number;

  readingDate: string;
  billingPeriod: string;
}

export interface WaterReadingResponse {
  id: number;

  unitId: number;
  unitNumber: string;

  meterId: string;

  tenantName: string;

  property: string;

  previousReading: number;
  currentReading: number;

  consumption: number;

  ratePerUnit: number;
  amount: number;

  billingPeriod: string;
  readingDate: string;

  status: "PENDING" | "APPROVED" | "REJECTED";

  recordedBy: string;
  recordedByRole: string;
  createdAt?: string

  rejectionReason?: string;
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