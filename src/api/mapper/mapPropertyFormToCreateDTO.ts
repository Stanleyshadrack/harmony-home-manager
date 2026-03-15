import { UnitFormData } from "@/types/property"
import { CreatePropertyUnitFormData } from "../dto/CreatePropertyUnitFormData"

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
}

const STATUS_MAP: Record<
  UnitFormData["status"],
  NonNullable<CreatePropertyUnitFormData["status"]>
> = {
  vacant: "VACANT",
  occupied: "OCCUPIED",
  maintenance: "MAINTENANCE",
}

export function mapUnitFormToApi(
  form: UnitFormData
): CreatePropertyUnitFormData {

  return {
    propertyId: form.propertyId,

    unitNumber: form.unitNumber,

    type: UNIT_TYPE_MAP[form.unitType],

    status: form.status ? STATUS_MAP[form.status] : null,

    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,

    lastReading: form.lastReading,
    lastReadingDate:form.lastReadingDate,

    squareFeet: form.squareFeet,

    monthlyRent: form.monthlyRent,
    deposit: form.deposit,

    meterId: form.meterId ? Number(form.meterId) : null,
  }
}
