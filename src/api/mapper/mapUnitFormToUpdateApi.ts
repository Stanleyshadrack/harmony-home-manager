import { UnitFormData } from "@/types/property";
import { UpdatePropertyUnitFormData } from "../dto/UpdatePropertyUnitFormData";
import { UNIT_TYPE_MAP, UNIT_STATUS_MAP } from "./unitEnumMaps";

export function mapUnitFormToUpdateApi(
  form: UnitFormData
): UpdatePropertyUnitFormData {
  return {
    unitNumber: form.unitNumber,
    type: UNIT_TYPE_MAP[form.unitType],

    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    sqft: form.squareFeet,
    monthlyRent: form.monthlyRent,
    deposit: form.deposit,

    status: UNIT_STATUS_MAP[form.status],

    meterId: form.meterId,
    amenities: form.amenities ?? [],
    floor: 1,
  };
}
