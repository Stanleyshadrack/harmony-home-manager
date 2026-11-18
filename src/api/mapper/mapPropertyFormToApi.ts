// api/mapper/mapPropertyFormToApi.ts

import { PropertyFormData } from "@/types/property";

export function mapPropertyFormToApi(
  form: PropertyFormData
) {
  return {
    name: form.name,
    address: form.address,
    city: form.city,
    state: form.state,
    country: form.country,
    postalCode: form.postalCode,
    propertyType: form.propertyType.toUpperCase(),
    ...(form.companyId != null ? { companyId: form.companyId } : {}),
    amenities: form.amenities,
  };
}
