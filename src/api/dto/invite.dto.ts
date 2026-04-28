export interface InviteUserRequest {
 email: string;
  role: "LANDLORD" | "TENANT" | "EMPLOYEE" | "ADMIN" | "SUPER_ADMIN";
  companyId?: number; 
  apartmentIds?: number[]; 
  unitId?: number;
}

export interface InviteUserResponse {
  status: number;
  message: string;
  timestamp: string;
}
