export interface CreateUnitApiDto {
  propertyId: number;

  unitNumber: string;
  type: "STUDIO" | "ONE_BEDROOM" | "TWO_BEDROOM" | "THREE_BEDROOM" | "PENTHOUSE";
  status: "VACANT" | "OCCUPIED" | "MAINTENANCE";

  bedrooms: number;
  bathrooms: number;
  sqft: number;

  monthlyRent: number;
  deposit: number;

  meterId: string;
  meterName: string;
  floor?: string;

  amenities: string[];
}
