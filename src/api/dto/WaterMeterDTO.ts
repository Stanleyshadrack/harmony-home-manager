export interface WaterMeter {
  id?: number;
  meterId: string;
  propertyId: string;
  unitId: string;
  installationDate: string;
  lastReadingDate?: string | null;
  lastReading?: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  meterType: "ANALOG" | "DIGITAL" | "SMART";
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  notes?: string;
}

export interface WaterMeterStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
}