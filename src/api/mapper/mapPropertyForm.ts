// src/api/mapper/mapPropertyFormToCreateDTO.ts
import { CreatePropertyFormData } from '../dto/apartmentApiDTO';
import { PropertyFormData } from "@/types/property";



export function mapPropertyFormToCreateDTO(
  form: PropertyFormData
): CreatePropertyFormData {
  return {
    name: form.name,
    address: form.address,
    city: form.city,
    state: form.state,
    country: form.country,
    postalCode: form.postalCode,
    propertyType: form.propertyType.toUpperCase(),

    amenities: form.amenities ?? [],

    // ✅ REQUIRED by backend
    units: [], // units are created separately
  };
}
