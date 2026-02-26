export type LoyaltyTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'new';

export interface TenantLoyaltyScore {
  tenantId: string;
  tier: LoyaltyTier;
  score: number; // 0-100
  factors: LoyaltyFactors;
  updatedAt: string;
}

export interface LoyaltyFactors {
  paymentHistory: number; // 0-40 points - on-time payments
  tenureMonths: number; // 0-20 points - length of stay
  maintenanceResponsibility: number; // 0-15 points - care for property
  communicationScore: number; // 0-15 points - responsiveness
  requestReasonability: number; // 0-10 points - reasonable requests
}

export interface LoyaltyHistoryEntry {
  id: string;
  tenantId: string;
  action: 'payment_on_time' | 'payment_late' | 'maintenance_request' | 'request_approved' | 'request_denied' | 'lease_renewal' | 'positive_feedback' | 'negative_feedback';
  pointsChange: number;
  description: string;
  createdAt: string;
}

// Tier thresholds
export const LOYALTY_TIERS: Record<LoyaltyTier, { min: number; max: number; label: string; color: string }> = {
  platinum: { min: 90, max: 100, label: 'Platinum', color: 'bg-violet-500' },
  gold: { min: 75, max: 89, label: 'Gold', color: 'bg-yellow-500' },
  silver: { min: 60, max: 74, label: 'Silver', color: 'bg-slate-400' },
  bronze: { min: 40, max: 59, label: 'Bronze', color: 'bg-orange-600' },
  new: { min: 0, max: 39, label: 'New Tenant', color: 'bg-muted' },
};

export const getTierFromScore = (score: number): LoyaltyTier => {
  if (score >= 90) return 'platinum';
  if (score >= 75) return 'gold';
  if (score >= 60) return 'silver';
  if (score >= 40) return 'bronze';
  return 'new';
};
