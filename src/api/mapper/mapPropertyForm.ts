// src/api/mapper/mapPropertyFormToCreateDTO.ts
import { CreatePropertyFormData, PropertyType } from '../dto/apartmentApiDTO';
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
    
    // Ensure the enum matches the backend's expected uppercase format
   propertyType: form.propertyType.toUpperCase() as PropertyType,

    amenities: form.amenities ?? [],

    // ✅ Map the companyId so the backend @NotNull validation passes!
    companyId: form.companyId,

    // ✅ REQUIRED by backend
    units: [], // units are created separately
  };
}