export interface ApartmentApiResponse{
      id: number;
  name: string;
  address: string;
  status: string;
  unitTypes: string[];
  waterUnitCost: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApartmentFormData{
  name: string;
    unitType: string[];
    status: string;
    location: string;
    waterUnitCost: number;
}