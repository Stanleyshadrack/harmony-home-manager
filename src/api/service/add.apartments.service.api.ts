import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";
import {
  CreatePropertyFormData,
  PropertyApiResponse,
  PropertyStatsResponse,
} from "../dto/apartmentApiDTO";
import { PropertyFormData } from "@/types/property";

export const PropertyApi = Object.freeze({
  /* =========================
      Create property
  ========================= */
  create: async (
    data: CreatePropertyFormData
  ): Promise<PropertyApiResponse> => {
    return apiRequest<CreatePropertyFormData, PropertyApiResponse>({
      path: API_PATHS.PROPERTIES,
      method: "POST",
      body: data,
    });
  },

  /* =========================
      Fetch all properties
  ========================= */
  fetchAll: () =>
    apiRequest<null, PropertyApiResponse[]>({
      path: API_PATHS.PROPERTIES,
      method: "GET",
    }),

  /* =========================
     🔍 Fetch property by ID
  ========================= */
  fetchById: (id: number) =>
    apiRequest<null, PropertyApiResponse>({
      path: API_PATHS.PROPERTY_BY_ID(id),
      method: "GET",
    }),

  /* =========================
     ✏️ Update property
  ========================= */
  update: (id: number, data: PropertyFormData) =>
    apiRequest<PropertyFormData, PropertyApiResponse>({
      path: API_PATHS.PROPERTY_BY_ID(id),
      method: "PUT",
      body: data,
    }),

  /* =========================
     🗑 Delete property
  ========================= */
  delete: (id: number) =>
    apiRequest<null, void>({
      path: API_PATHS.PROPERTY_BY_ID(id),
      method: "DELETE",
    }),

  /* =========================
     📊 Fetch property stats
  ========================= */
  fetchStats: (propertyId: number) =>
    apiRequest<null, PropertyStatsResponse>({
      path: API_PATHS.PROPERTY_STATS(propertyId),
      method: "GET",
    }),

  /* =========================
     🏢 Fetch property units
  ========================= */
  fetchUnits: (propertyId: number) =>
    apiRequest<null, any[]>({
      path: API_PATHS.PROPERTY_UNITS(propertyId),
      method: "GET",
    }),

  /* =========================
     👤 Assign property to landlord
  ========================= */
  assignLandlord: (propertyId: number, landlordId: number) =>
    apiRequest<
      { propertyId: number; landlordId: number },
      PropertyApiResponse
    >({
      path: API_PATHS.ASSIGN_PROPERTY,
      method: "POST",
      body: {
        propertyId,
        landlordId,
      },
    }),

  /* =========================
     ❌ Unassign landlord
  ========================= */
  unassignLandlord: (propertyId: number) =>
    apiRequest<null, PropertyApiResponse>({
      path: API_PATHS.UNASSIGN_PROPERTY(propertyId),
      method: "DELETE",
    }),
});