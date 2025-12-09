import { useState, useCallback } from 'react';
import { Property, PropertyFormData, Unit, UnitFormData } from '@/types/property';

// Mock data - will be replaced with Supabase queries
const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Sunset Apartments',
    address: '123 Sunset Drive',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    postalCode: '00100',
    propertyType: 'apartment',
    totalUnits: 24,
    occupiedUnits: 22,
    amenities: ['Parking', 'Security', 'Water Tank', 'Generator'],
    photos: [],
    landlordId: 'landlord-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Garden View Residences',
    address: '456 Garden Road',
    city: 'Mombasa',
    state: 'Mombasa County',
    country: 'Kenya',
    postalCode: '80100',
    propertyType: 'apartment',
    totalUnits: 16,
    occupiedUnits: 14,
    amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security'],
    photos: [],
    landlordId: 'landlord-1',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
  },
  {
    id: '3',
    name: 'Kilimani Heights',
    address: '789 Kilimani Lane',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    postalCode: '00100',
    propertyType: 'apartment',
    totalUnits: 32,
    occupiedUnits: 28,
    amenities: ['Rooftop Terrace', 'Parking', 'Security', 'Elevator'],
    photos: [],
    landlordId: 'landlord-1',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
  },
];

const mockUnits: Unit[] = [
  {
    id: '1',
    propertyId: '1',
    unitNumber: 'A101',
    unitType: 'two_bedroom',
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 850,
    monthlyRent: 25000,
    deposit: 25000,
    status: 'occupied',
    meterId: 'WM-001',
    amenities: ['Balcony', 'Built-in Wardrobe'],
    photos: [],
    currentTenantId: 'tenant-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    propertyId: '1',
    unitNumber: 'A102',
    unitType: 'one_bedroom',
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 550,
    monthlyRent: 18000,
    deposit: 18000,
    status: 'vacant',
    meterId: 'WM-002',
    amenities: ['Balcony'],
    photos: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    propertyId: '1',
    unitNumber: 'A103',
    unitType: 'studio',
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 400,
    monthlyRent: 12000,
    deposit: 12000,
    status: 'maintenance',
    meterId: 'WM-003',
    amenities: [],
    photos: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '4',
    propertyId: '2',
    unitNumber: 'B201',
    unitType: 'three_bedroom',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1200,
    monthlyRent: 45000,
    deposit: 45000,
    status: 'occupied',
    meterId: 'WM-004',
    amenities: ['Balcony', 'En-suite', 'Walk-in Closet'],
    photos: [],
    currentTenantId: 'tenant-2',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
  },
];

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [isLoading, setIsLoading] = useState(false);

  const addProperty = useCallback(async (data: PropertyFormData): Promise<Property> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newProperty: Property = {
        id: `prop-${Date.now()}`,
        ...data,
        totalUnits: 0,
        occupiedUnits: 0,
        photos: [],
        landlordId: 'current-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setProperties((prev) => [...prev, newProperty]);
      return newProperty;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProperty = useCallback(async (id: string, data: Partial<PropertyFormData>): Promise<Property> => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let updatedProperty: Property | undefined;
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            updatedProperty = { ...p, ...data, updatedAt: new Date().toISOString() };
            return updatedProperty;
          }
          return p;
        })
      );
      
      if (!updatedProperty) throw new Error('Property not found');
      return updatedProperty;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProperty = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    properties,
    isLoading,
    addProperty,
    updateProperty,
    deleteProperty,
  };
}

export function useUnits(propertyId?: string) {
  const [units, setUnits] = useState<Unit[]>(
    propertyId ? mockUnits.filter((u) => u.propertyId === propertyId) : mockUnits
  );
  const [isLoading, setIsLoading] = useState(false);

  const addUnit = useCallback(async (data: UnitFormData): Promise<Unit> => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newUnit: Unit = {
        id: `unit-${Date.now()}`,
        ...data,
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setUnits((prev) => [...prev, newUnit]);
      return newUnit;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUnit = useCallback(async (id: string, data: Partial<UnitFormData>): Promise<Unit> => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let updatedUnit: Unit | undefined;
      setUnits((prev) =>
        prev.map((u) => {
          if (u.id === id) {
            updatedUnit = { ...u, ...data, updatedAt: new Date().toISOString() };
            return updatedUnit;
          }
          return u;
        })
      );
      
      if (!updatedUnit) throw new Error('Unit not found');
      return updatedUnit;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteUnit = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUnits((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    units,
    isLoading,
    addUnit,
    updateUnit,
    deleteUnit,
  };
}
