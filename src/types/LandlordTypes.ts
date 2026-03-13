export interface LandlordTypes {
  id: number;

  // User fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;

  billingCycle?: "MONTHLY" | "ANNUAL";

  // Business
  company?: string;

  // Status & subscription
  status: "active" | "suspended" | "pending";
  subscription: "BASIC" | "PREMIUM" | "ENTERPRISE";
  subscriptionStartDate: string;
  subscriptionEndDate: string;

  // Limits
  maxProperties: number;
  maxUnits: number;
  currentProperties: number;
  currentUnits: number;

  // Audit
  createdAt: string;
  updatedAt: string;
  lastReminderSent?: string;
}

export interface EmployeeDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  approved: boolean;
  propertyId?: number;
}