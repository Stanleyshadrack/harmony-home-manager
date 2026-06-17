export type SubscriptionPlan = "BASIC" | "PREMIUM" | "ENTERPRISE";
export type SubscriptionStatus = "ACTIVE" | "SUSPENDED" | "EXPIRED";
export type BillingCycle = "MONTHLY" | "ANNUAL";

export interface SubscriptionResponse {
  id: number;
  
  // 🔥 Shifted to Company
  companyId: number;
  companyName?: string; 
  
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  maxProperties: number;
  maxUnits: number;
  currentProperties: number;
  currentUnits: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSubscriptionRequest {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
}