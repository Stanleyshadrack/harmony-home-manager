export interface UpdatePropertyUnitFormData {
  unitNumber: string;
  type:
    | "STUDIO"
    | "ONE_BEDROOM"
    | "TWO_BEDROOM"
    | "THREE_BEDROOM"
    | "PENTHOUSE";

  bedrooms: number;
  bathrooms: number;
  sqft: number;
  monthlyRent: number;
  deposit: number;
  status: "VACANT" | "OCCUPIED" | "MAINTENANCE";
  meterId: string;
  amenities: string[];
  floor: number;
}
