// api/mapper/mapPropertyFormToApi.ts

import { PropertyFormData } from "@/types/property";
import { PropertyType } from "../dto/apartmentApiDTO";

export function mapPropertyFormToApi(
  form: PropertyFormData
) {
  return {
    name: form.name,
    address: form.address,
     companyId: Number(form.companyId),
    city: form.city,
    state: form.state,
    country: form.country,
    postalCode: form.postalCode,
    // propertyType: form.propertyType.toUpperCase(),
    propertyType: form.propertyType.toUpperCase() as PropertyType,
    amenities: form.amenities,
  };
}
