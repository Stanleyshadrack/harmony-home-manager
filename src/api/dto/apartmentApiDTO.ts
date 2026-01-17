import { CreatePropertyUnitFormData } from "./CreatePropertyUnitFormData";

// Matches PropertyDTO (backend)
export interface PropertyApiResponse {
  id: number;

  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  /** apartment | house | commercial | mixed */
  propertyType: PropertyType;

  amenities: string[];

  totalUnits: number;
  occupiedUnits: number;

  landlordId: number;

  createdAt: string;
  updatedAt: string;
}

// Matches PropertyStatsDTO
export interface PropertyStatsResponse {
  propertyId: number;
  totalUnits: number;
  vacantUnits: number;
  occupiedUnits: number;
  maintenanceUnits: number;
}

// Matches CreatePropertyWithUnitsRequest
export interface CreatePropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  propertyType: string;
  amenities?: string[];
  units?: CreatePropertyUnitFormData[]; // ✅ OPTIONAL
}


// Minimal frontend version of UnitCreateDTO
export interface UnitCreateFormData {
  unitNumber: string;
  unitType: string;
  rentAmount: number;
}

export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "COMMERCIAL"
  | "MIXED";
