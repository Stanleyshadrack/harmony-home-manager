export interface PropertyUnitApiResponse {
  id: number;
  propertyId: number;
  unitNumber: string;

  // ✅ ADD THIS (matches backend)
  unitType: "STUDIO" | "ONE_BEDROOM" | "TWO_BEDROOM" | "THREE_BEDROOM" | "PENTHOUSE";

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
