export interface UnitApplication {
  id: string;
  unitId: string;
  unitNumber: string;
  propertyName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
  monthlyIncome: number;
  moveInDate: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface UnitApplicationFormData {
  unitId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  employmentStatus: UnitApplication['employmentStatus'];
  monthlyIncome: number;
  moveInDate: string;
  message?: string;
}
