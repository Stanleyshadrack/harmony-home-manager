export interface CreatePropertyUnitFormData {
  propertyId: string

  unitNumber: string

  type:
    | "STUDIO"
    | "ONE_BEDROOM"
    | "TWO_BEDROOM"
    | "THREE_BEDROOM"
    | "PENTHOUSE"

  status: "VACANT" | "OCCUPIED" | "MAINTENANCE" | null

  bedrooms: number
  bathrooms: number

  squareFeet: number

   lastReading: string,
    lastReadingDate: string,

  monthlyRent: number
  deposit: number

  meterId?: number | null
}




export interface PropertyUnitApiResponse {
  id: string;
  propertyId: string;

  unitNumber: string;

  unitType:
    | "STUDIO"
    | "ONE_BEDROOM"
    | "TWO_BEDROOM"
    | "THREE_BEDROOM"
    | "PENTHOUSE";

  bedrooms: number;
  bathrooms: number;

  squareFeet: number;

  monthlyRent: number;
  deposit: number;

  status: "VACANT" | "OCCUPIED" | "MAINTENANCE";

  meterId?: string | null;
  meterName?: string | null;

  lastReading?: number;
  lastReadingDate?: string;

  photos?: string[];

  currentTenantId?: string | null;

  createdAt?: string;
  updatedAt?: string;
}



export interface CreateUnitApiDto {
  propertyId: string;

  unitNumber: string;

  type:
    | "STUDIO"
    | "ONE_BEDROOM"
    | "TWO_BEDROOM"
    | "THREE_BEDROOM"
    | "PENTHOUSE";

  status: "VACANT" | "OCCUPIED" | "MAINTENANCE";

  bedrooms: number;
  bathrooms: number;

  squareFeet: number;

  monthlyRent: number;
  deposit: number;

  meterId?: number | null;
}

