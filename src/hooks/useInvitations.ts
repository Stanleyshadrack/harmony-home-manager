import { useState, useEffect, useCallback } from 'react';
import { Invitation, InvitationFormData, InvitationStatus } from '@/types/invitation';
import { UserRole } from '@/contexts/AuthContext';

const STORAGE_KEY = 'user_invitations';
const INVITATION_EXPIRY_DAYS = 7;

const getStoredInvitations = (): Invitation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveInvitations = (invitations: Invitation[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invitations));
};

const generateToken = (): string => {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredInvitations();
    // Mark expired invitations
    const now = new Date();
    const updated = stored.map(inv => {
      if (inv.status === 'pending' && new Date(inv.expiresAt) < now) {
        return { ...inv, status: 'expired' as InvitationStatus };
      }
      return inv;
    });
    setInvitations(updated);
    saveInvitations(updated);
    setIsLoading(false);
  }, []);

  const createInvitation = useCallback(
    async (
      data: InvitationFormData,
      invitedBy: { name: string; email: string; role: UserRole }
    ): Promise<Invitation> => {
      await new Promise(resolve => setTimeout(resolve, 300));

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

      const newInvitation: Invitation = {
        id: `inv-${Date.now()}`,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: 'pending',
        invitedBy: invitedBy.name,
        invitedByEmail: invitedBy.email,
        invitedByRole: invitedBy.role,
        token: generateToken(),
        message: data.message,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      const updated = [...invitations, newInvitation];
      setInvitations(updated);
      saveInvitations(updated);

      return newInvitation;
    },
    [invitations]
  );

  const getInvitationByToken = useCallback(
    (token: string): Invitation | undefined => {
      return invitations.find(inv => inv.token === token);
    },
    [invitations]
  );

  const getInvitationByEmail = useCallback(
    (email: string): Invitation | undefined => {
      return invitations.find(
        inv => inv.email.toLowerCase() === email.toLowerCase() && inv.status === 'pending'
      );
    },
    [invitations]
  );

  const acceptInvitation = useCallback(
    async (token: string): Promise<boolean> => {
      await new Promise(resolve => setTimeout(resolve, 300));

      const invitation = invitations.find(inv => inv.token === token);
      if (!invitation || invitation.status !== 'pending') {
        return false;
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        const updated = invitations.map(inv =>
          inv.id === invitation.id ? { ...inv, status: 'expired' as InvitationStatus } : inv
        );
        setInvitations(updated);
        saveInvitations(updated);
        return false;
      }

      const updated = invitations.map(inv =>
        inv.id === invitation.id
          ? { ...inv, status: 'accepted' as InvitationStatus, acceptedAt: new Date().toISOString() }
          : inv
      );
      setInvitations(updated);
      saveInvitations(updated);
      return true;
    },
    [invitations]
  );

  const revokeInvitation = useCallback(
    async (id: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const updated = invitations.map(inv =>
        inv.id === id ? { ...inv, status: 'revoked' as InvitationStatus } : inv
      );
      setInvitations(updated);
      saveInvitations(updated);
    },
    [invitations]
  );

  const resendInvitation = useCallback(
    async (id: string): Promise<Invitation | null> => {
      await new Promise(resolve => setTimeout(resolve, 300));

      const invitation = invitations.find(inv => inv.id === id);
      if (!invitation) return null;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

      const updated = invitations.map(inv =>
        inv.id === id
          ? {
              ...inv,
              status: 'pending' as InvitationStatus,
              token: generateToken(),
              expiresAt: expiresAt.toISOString(),
            }
          : inv
      );
      setInvitations(updated);
      saveInvitations(updated);

      return updated.find(inv => inv.id === id) || null;
    },
    [invitations]
  );

  const getPendingInvitations = useCallback(() => {
    return invitations.filter(inv => inv.status === 'pending');
  }, [invitations]);

  const getInvitationsByInviter = useCallback(
    (email: string) => {
      return invitations.filter(inv => inv.invitedByEmail === email);
    },
    [invitations]
  );

  return {
    invitations,
    isLoading,
    createInvitation,
    getInvitationByToken,
    getInvitationByEmail,
    acceptInvitation,
    revokeInvitation,
    resendInvitation,
    getPendingInvitations,
    getInvitationsByInviter,
  };
}
