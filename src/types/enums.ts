export const UNIT_TYPES = [
  "studio",
  "one_bedroom",
  "two_bedroom",
  "three_bedroom",
  "penthouse",
] as const;

export type UnitType = typeof UNIT_TYPES[number];

export const UNIT_STATUSES = [
  "vacant",
  "occupied",
  "maintenance",
] as const;

export type UnitStatus = typeof UNIT_STATUSES[number];
