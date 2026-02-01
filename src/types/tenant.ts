export interface Tenant {
  id: string;
  userId: string;
  email: string;

  firstName: string;
  lastName: string;
  phone: string;
  emergencyContact?: string;
   emergencyPhone?: string; // ✅ ADD THIS

  unitId?: string;
  unitNumber?: string;

  status: 'ACTIVE' | 'PENDING' | 'MOVED_OUT';
  moveInDate?: string;

   avatarUrl?: string; 
    propertyName?: string;
}


export interface Lease {
  id: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'active' | 'pending' | 'expired' | 'terminated';
  terms?: string;
  signedAt?: string;
  createdAt: string;
}

export interface TenantDocument {
  id: string;
  tenantId: string;
  name: string;
  type: 'id' | 'lease' | 'proof_of_income' | 'reference' | 'other';
  url: string;
  uploadedAt: string;
  size: number;
}

export interface TenantFormData {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  phone: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  unitId: string;
}

export interface LeaseFormData {
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  terms?: string;
}
