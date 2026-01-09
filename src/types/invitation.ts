import { UserRole } from '@/contexts/AuthContext';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedByEmail: string;
  invitedByRole: UserRole;
  token: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface InvitationFormData {
  email: string;
  role: UserRole;
}
