import { Landlord } from "@/hooks/useLandlords";

export const normalizeBackendSubscription = (
  value?: string
): Landlord["subscription"] => {
  switch (value) {
    case "BASIC":
      return "basic";
    case "PREMIUM":
      return "premium";
    case "ENTERPRISE":
      return "enterprise";
    default:
      return "basic";
  }
};




export const mapLandlordDto = (dto: any): Landlord => ({
  id: String(dto.id),
  firstName: dto.firstName ?? "",
  lastName: dto.lastName ?? "",
  email: dto.email,
  phone: dto.phone,
  company: dto.company,
  avatarUrl: dto.avatarUrl,

  status: dto.status,

  // 🔥 normalize subscription here
  subscription: normalizeBackendSubscription(dto.subscription),

  subscriptionStartDate: dto.subscriptionStartDate ?? "",
  subscriptionEndDate: dto.subscriptionEndDate ?? "",

  maxProperties: dto.maxProperties,
  maxUnits: dto.maxUnits,
  currentProperties: dto.currentProperties,
  currentUnits: dto.currentUnits,

  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
  lastReminderSent: dto.lastReminderSent,
});