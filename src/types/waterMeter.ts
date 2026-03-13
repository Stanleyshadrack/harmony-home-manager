export interface WaterMeter {
  id: string;
  meterId: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  installationDate: Date;
  lastReadingDate: Date | null;
  lastReading: number;
  status: 'active' | 'inactive' | 'maintenance';
  meterType: 'analog' | 'digital' | 'smart';
  manufacturer: string;
  model: string;
  serialNumber: string;
  notes: string;
}