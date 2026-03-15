export interface UpdatePropertyUnitFormData {
  propertyId: string

  unitNumber: string

  type:
    | "STUDIO"
    | "ONE_BEDROOM"
    | "TWO_BEDROOM"
    | "THREE_BEDROOM"
    | "PENTHOUSE"

  bedrooms: number
  bathrooms: number

  squareFeet: number

  monthlyRent: number
  deposit: number

  status: "VACANT" | "OCCUPIED" | "MAINTENANCE"

  meterId?: number | null
}
