import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PropertyApi } from '@/api/service/add.apartments.service.api';
import { Property, PropertyFormData, Unit, UnitFormData } from '@/types/property';
import { toast } from '@/components/ui/use-toast';

import { PropertyUnitApiResponse } from '@/api/dto/PropertyUnitApiResponse';
import { mapPropertyFormToApi } from '@/api/mapper/mapPropertyFormToApi';
import { PropertyUnitsApi } from '@/api/service/PropertyUnitsApi';
import { mapUnitFormToApi } from '@/api/mapper/mapPropertyFormToCreateDTO';
import { mapUnitFormToUpdateApi } from '@/api/mapper/mapUnitFormToUpdateApi';

/* =========================
   API → UI mapper
========================= */
const safe = (v?: string | null) => v ?? '';

const mapApiProperty = (p: any): Property => ({
  id: String(p.id),
  name: safe(p.name),
  address: safe(p.address),
  city: safe(p.city),
  state: safe(p.state),
  country: safe(p.country),
  postalCode: safe(p.postalCode),
  propertyType: p.propertyType?.toLowerCase() ?? 'apartment',
  totalUnits: p.totalUnits ?? 0,
  occupiedUnits: p.occupiedUnits ?? 0,
  amenities: p.amenities ?? [],
  photos: [],
  landlordId: String(p.landlordId ?? ''),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});


export function useProperties() {
  const queryClient = useQueryClient();

  /* =========================
     FETCH PROPERTIES
  ========================= */
  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: PropertyApi.fetchAll,
    select: (data) => data.map(mapApiProperty),
    retry: false,
  });

  useEffect(() => {
    if (propertiesQuery.isError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          (propertiesQuery.error as any)?.message ??
          'Failed to fetch properties',
      });
    }
  }, [propertiesQuery.isError]);

  /* =========================
     CREATE PROPERTY
  ========================= */
  const createMutation = useMutation({
    mutationFn: (data: PropertyFormData) =>
      PropertyApi.create(mapPropertyFormToApi(data)),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });

      toast({
        title: 'Success',
        description: 'Property created successfully',
      });
    },

    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message ?? 'Failed to create property',
      });
    },
  });

  /* =========================
     UPDATE PROPERTY
  ========================= */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PropertyFormData }) =>
      PropertyApi.update(Number(id), data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });

      toast({
        title: 'Success',
        description: 'Property updated successfully',
      });
    },

    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message ?? 'Failed to update property',
      });
    },
  });

  /* =========================
     DELETE PROPERTY
  ========================= */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => PropertyApi.delete(Number(id)),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });

      toast({
        title: 'Success',
        description: 'Property deleted successfully',
      });
    },

    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message ?? 'Failed to delete property',
      });
    },
  });

  /* =========================
     ASSIGN LANDLORD
  ========================= */
  const assignLandlordMutation = useMutation({
    mutationFn: ({
      propertyId,
      landlordId,
    }: {
      propertyId: number;
      landlordId: number;
    }) => PropertyApi.assignLandlord(propertyId, landlordId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });

      toast({
        title: 'Success',
        description: 'Landlord assigned successfully',
      });
    },

    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message ?? 'Failed to assign landlord',
      });
    },
  });

  /* =========================
     UNASSIGN LANDLORD
  ========================= */
  const unassignLandlordMutation = useMutation({
    mutationFn: (propertyId: number) =>
      PropertyApi.unassignLandlord(propertyId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });

      toast({
        title: 'Success',
        description: 'Landlord unassigned successfully',
      });
    },

    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message ?? 'Failed to unassign landlord',
      });
    },
  });

  return {
    properties: propertiesQuery.data ?? [],
    isLoading: propertiesQuery.isLoading,

    /* CRUD */
    addProperty: createMutation.mutateAsync,

    updateProperty: (id: string, data: PropertyFormData) =>
      updateMutation.mutateAsync({ id, data }),

    deleteProperty: deleteMutation.mutateAsync,

    /* Landlord assignment */
    assignLandlord: (propertyId: number, landlordId: number) =>
      assignLandlordMutation.mutateAsync({ propertyId, landlordId }),

    unassignLandlord: (propertyId: number) =>
      unassignLandlordMutation.mutateAsync(propertyId),
  };
}


// units mapper

export function mapUnitFromApi(api: PropertyUnitApiResponse): Unit {
  return {
    id: String(api.id),
    propertyId: String(api.propertyId),

    unitNumber: api.unitNumber,
    unitType: api.unitType.toLowerCase() as Unit["unitType"],


    bedrooms: api.bedrooms,
    bathrooms: api.bathrooms,
    squareFeet: api.sqft,

    monthlyRent: api.monthlyRent,
    deposit: api.deposit,

    status: api.status.toLowerCase() as Unit["status"],

    meterId: api.meterId ?? "",
    amenities: api.amenities ?? [],

    photos: [],
    currentTenantId: undefined,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/* ======================================================
   🔒 KEEP useUnits EXACTLY AS YOU HAVE IT
====================================================== */

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /* =========================
     📄 FETCH ALL UNITS
  ========================= */
  useEffect(() => {
    setIsLoading(true);

    PropertyUnitsApi.fetchAll()
      .then((res) => setUnits(res.map(mapUnitFromApi)))
      .finally(() => setIsLoading(false));
  }, []);

  /* =========================
     ➕ ADD UNIT
  ========================= */
  const addUnit = async (data: UnitFormData) => {
    setIsLoading(true);
    try {
      const apiUnit = await PropertyUnitsApi.create(
        mapUnitFormToApi(data)
      );
      const unit = mapUnitFromApi(apiUnit);
      setUnits((prev) => [...prev, unit]);
      return unit;
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     ✏️ UPDATE UNIT
  ========================= */
  const updateUnit = async (id: string, data: UnitFormData) => {
    setIsLoading(true);
    try {
      const apiUnit = await PropertyUnitsApi.update(
        id,
        mapUnitFormToUpdateApi(data)
      );
      const updated = mapUnitFromApi(apiUnit);

      setUnits((prev) =>
        prev.map((u) => (u.id === id ? updated : u))
      );

      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     🗑 DELETE UNIT
  ========================= */
  const deleteUnit = async (id: string) => {
    setIsLoading(true);
    try {
      await PropertyUnitsApi.delete(id);
      setUnits((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    units,
    isLoading,
    addUnit,
    updateUnit,
    deleteUnit,
  };
}
