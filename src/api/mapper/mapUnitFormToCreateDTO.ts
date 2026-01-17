import { UnitFormData } from "@/types/property";
import { CreatePropertyUnitFormData } from "../dto/CreatePropertyUnitFormData";
import { UNIT_TYPE_MAP } from "./unitEnumMaps";

/* =========================
   UI → API status mapping
========================= */
const STATUS_MAP: Record<
  UnitFormData["status"],
  Exclude<CreatePropertyUnitFormData["status"], null>
> = {
  vacant: "VACANT",
  occupied: "OCCUPIED",
  maintenance: "MAINTENANCE",
};

export function mapUnitFormToCreateApi(
  form: UnitFormData
): CreatePropertyUnitFormData {
  const mappedType = UNIT_TYPE_MAP[form.unitType];

  return {
    propertyId: Number(form.propertyId),
    unitNumber: form.unitNumber,

    // ✅ BOTH REQUIRED
    type: mappedType,
    unitType: mappedType,

    status: STATUS_MAP[form.status],

    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    sqft: form.squareFeet,

    monthlyRent: form.monthlyRent,
    deposit: form.deposit,

    meterId: form.meterId,
    amenities: form.amenities ?? [],
    floor: 1,
  };
}
