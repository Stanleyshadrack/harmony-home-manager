import { CreateUnitFormData } from "./CreatePropertyUnitFormData";

export interface PropertyApiResponse {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  companyId: number;
  companyName?: string;

  propertyType: PropertyType;

  amenities: string[];

  totalUnits: number;
  occupiedUnits: number;

  
  landlordIds: number[];
  landlordNames: string[];

  createdAt: string;
  updatedAt: string;
}


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
  companyId: number;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  propertyType: PropertyType;

  amenities?: string[];
  units?: UnitCreateFormData[];
  landlordIds?: number[];
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
