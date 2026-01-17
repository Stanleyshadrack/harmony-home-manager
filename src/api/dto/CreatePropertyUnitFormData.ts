export interface CreatePropertyUnitFormData {
  propertyId: number;
  unitNumber: string;

  // ✅ KEEP for backend create contract
  type:
    | "STUDIO"
    | "ONE_BEDROOM"
    | "TWO_BEDROOM"
    | "THREE_BEDROOM"
    | "PENTHOUSE";

  // ✅ ADD THIS (used by frontend / consistency)
  unitType:
    | "STUDIO"
    | "ONE_BEDROOM"
    | "TWO_BEDROOM"
    | "THREE_BEDROOM"
    | "PENTHOUSE";

  status: "VACANT" | "OCCUPIED" | "MAINTENANCE" | null;

  bedrooms: number;
  bathrooms: number;
  sqft: number;
  monthlyRent: number;
  deposit: number;
  meterId: string;
  amenities: string[];
  floor: number;
}
