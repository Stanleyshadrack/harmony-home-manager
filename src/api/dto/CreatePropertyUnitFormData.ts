export interface CreatePropertyUnitFormData {
  propertyId: string;

  unitNumber: string;

  type:
    | "STUDIO"
    | "ONE_BEDROOM"
    | "TWO_BEDROOM"
    | "THREE_BEDROOM"
    | "PENTHOUSE";

  status: "VACANT" | "OCCUPIED" | "MAINTENANCE" | null;

  bedrooms: number;
  bathrooms: number;

  squareFeet: number;

  monthlyRent: number;
  deposit: number;

  meterId?: string | null;
}