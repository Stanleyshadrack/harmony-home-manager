import type { LandlordTypes } from "@/types/LandlordTypes";

export const normalizeBackendSubscription = (
  value?: string
): LandlordTypes["subscription"] => {
  switch (value?.toUpperCase()) {
    case "PREMIUM":
      return "PREMIUM";
    case "ENTERPRISE":
      return "ENTERPRISE";
    default:
      return "BASIC";
  }
};

export const mapLandlordDto = (dto: any): LandlordTypes => ({
  id: Number(dto.id),
  firstName: dto.firstName ?? "",
  lastName: dto.lastName ?? "",
  email: dto.email ?? "",
  phone: dto.phone ?? "",
  company: dto.company ?? dto.companyName,
  avatarUrl: dto.avatarUrl,

  status: String(dto.status ?? "pending").toLowerCase() === "active"
    ? "active"
    : String(dto.status ?? "").toLowerCase() === "suspended"
      ? "suspended"
      : "pending",

  subscription: normalizeBackendSubscription(dto.subscription),
  subscriptionStartDate: dto.subscriptionStartDate ?? "",
  subscriptionEndDate: dto.subscriptionEndDate ?? "",

  maxProperties: Number(dto.maxProperties ?? 0),
  maxUnits: Number(dto.maxUnits ?? 0),
  currentProperties: Number(dto.currentProperties ?? 0),
  currentUnits: Number(dto.currentUnits ?? 0),

  createdAt: dto.createdAt ?? "",
  updatedAt: dto.updatedAt ?? "",
  lastReminderSent: dto.lastReminderSent,
});
