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
  unitType: 'studio' | 'one_bedroom' | 'two_bedroom' | 'three_bedroom' | 'penthouse';
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  deposit: number;
  status: 'vacant' | 'occupied' | 'maintenance';
  meterId: string;
  amenities: string[];
  photos: string[];
  currentTenantId?: string;
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
  amenities: string[];
}

export interface UnitFormData {
  propertyId: string;
  unitNumber: string;
  unitType: Unit['unitType'];
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  deposit: number;
  status: Unit['status'];
  meterId: string;
  amenities: string[];
}
