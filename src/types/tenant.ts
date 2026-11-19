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
  moveInClearedAt?: string | null;
  leaseStart?: string | null;
  leaseEnd?: string | null;
  leaseStatus?: 'PENDING' | 'ACTIVE' | 'VACATED' | 'OCCUPIED' | null;
  rentAmount?: number | null;
  depositAmount?: number | null;
  idDocumentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  leaseDocumentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;

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
