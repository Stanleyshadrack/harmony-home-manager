

export type SubscriptionPlan = "BASIC" | "PREMIUM" | "ENTERPRISE";

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number;
  maxProperties: number;
  maxUnits: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  {
    id: "BASIC",
    name: "Basic Plan",
    price: 29,
    maxProperties: 3,
    maxUnits: 10,
    features: ["Up to 3 properties", "Up to 10 units", "Basic reports"],
  },
  {
    id: "PREMIUM",
    name: "Premium Plan",
    price: 79,
    maxProperties: 10,
    maxUnits: 50,
    features: ["Up to 10 properties", "Up to 50 units", "Advanced reports"],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise Plan",
    price: 199,
    maxProperties: 999,
    maxUnits: 9999,
    features: ["Unlimited properties", "Unlimited units", "API access"],
  },
];
