export interface WaterMeter {
  id: string
  meterName: string

  propertyId: number
  propertyName?: string

  unitId?: number | null
  unitNumber?: string | null

  installationDate?: string | null
  lastReadingDate?: string | null
  lastReading?: number

  status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
  meterType?: "ANALOG" | "DIGITAL" | "SMART"

  manufacturer?: string
  model?: string
  serialNumber?: string
  notes?: string
}