import { WaterMeter } from "@/api/dto/WaterMeterDTO"


export type MeterForm = {
  meterId: string
  propertyId: string
  unitId?: string
  meterType: WaterMeter["meterType"]
  manufacturer: string
  model: string
  serialNumber: string
  notes: string
  lastReading: number
}