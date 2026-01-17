import { UnitType, UnitStatus } from "@/types/enums";

export const UNIT_TYPE_MAP: Record<UnitType, 
  | "STUDIO"
  | "ONE_BEDROOM"
  | "TWO_BEDROOM"
  | "THREE_BEDROOM"
  | "PENTHOUSE"
> = {
  studio: "STUDIO",
  one_bedroom: "ONE_BEDROOM",
  two_bedroom: "TWO_BEDROOM",
  three_bedroom: "THREE_BEDROOM",
  penthouse: "PENTHOUSE",
};

export const UNIT_STATUS_MAP: Record<UnitStatus,
  | "VACANT"
  | "OCCUPIED"
  | "MAINTENANCE"
> = {
  vacant: "VACANT",
  occupied: "OCCUPIED",
  maintenance: "MAINTENANCE",
};
