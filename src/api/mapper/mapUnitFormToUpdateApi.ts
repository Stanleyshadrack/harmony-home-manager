import { UnitFormData } from "@/types/property";
import { UpdatePropertyUnitFormData } from "../dto/UpdatePropertyUnitFormData";
import { UNIT_TYPE_MAP, UNIT_STATUS_MAP } from "./unitEnumMaps";
import { CreatePropertyUnitFormData } from "../dto/CreatePropertyUnitFormData";

export function mapUnitFormToUpdateApi(
  form: UnitFormData
): UpdatePropertyUnitFormData {

  return {
    propertyId: form.propertyId,

    unitNumber: form.unitNumber,

    type: UNIT_TYPE_MAP[form.unitType],

    status: UNIT_STATUS_MAP[form.status],

    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,

    squareFeet: form.squareFeet,

    monthlyRent: form.monthlyRent,
    deposit: form.deposit,

    meterId: form.meterId ? Number(form.meterId) : null,
  }
}


