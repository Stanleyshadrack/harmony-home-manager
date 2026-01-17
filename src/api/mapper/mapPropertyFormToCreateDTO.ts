import { UnitFormData } from "@/types/property";
import { CreatePropertyUnitFormData } from "../dto/CreatePropertyUnitFormData";

/* =========================
   UI → API enum mapping
========================= */
const UNIT_TYPE_MAP: Record<
  UnitFormData["unitType"],
  CreatePropertyUnitFormData["type"]
> = {
  studio: "STUDIO",
  one_bedroom: "ONE_BEDROOM",
  two_bedroom: "TWO_BEDROOM",
  three_bedroom: "THREE_BEDROOM",
  penthouse: "PENTHOUSE",
};

const STATUS_MAP: Record<
  UnitFormData["status"],
  Exclude<CreatePropertyUnitFormData["status"], null>
> = {
  vacant: "VACANT",
  occupied: "OCCUPIED",
  maintenance: "MAINTENANCE",
};

export function mapUnitFormToApi(
  form: UnitFormData
): CreatePropertyUnitFormData {
  const mappedType = UNIT_TYPE_MAP[form.unitType];

  return {
    propertyId: Number(form.propertyId),
    unitNumber: form.unitNumber,

    // ✅ BOTH REQUIRED FIELDS
    type: mappedType,
    unitType: mappedType,

    status: form.status ? STATUS_MAP[form.status] : null,

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
