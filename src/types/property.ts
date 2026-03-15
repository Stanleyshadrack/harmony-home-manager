import { UnitStatus, UnitType } from "./enums";

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  propertyType: 'apartment' | 'house' | 'commercial' | 'mixed';
  totalUnits: number;
  occupiedUnits: number;
  amenities: string[];
  photos: string[];
  landlordId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;

  unitNumber: string;
  unitType: UnitType;

  bedrooms: number;
  bathrooms: number;
  squareFeet: number;

  monthlyRent: number;
  deposit: number;

  status: UnitStatus;

  currentTenantId?: string | null;

  meterId?: string | null;
  meterName?: string | null;

  photos: string[];

  createdAt: string;
  updatedAt: string;
}

export interface PropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  propertyType: Property['propertyType'];
  amenities?: string[];
}

export interface UnitFormData {
  propertyId: string;
  unitNumber: string;

  unitType: UnitType;

  bedrooms: number;
  bathrooms: number;
  squareFeet: number;

  monthlyRent: number;
  deposit: number;

  status: UnitStatus;

  meterId?: string;
}
