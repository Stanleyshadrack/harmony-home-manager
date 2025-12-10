import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logAuditEvent, AuditAction } from '@/services/auditService';

export const useAudit = () => {
  const { user } = useAuth();

  const log = useCallback((
    action: AuditAction,
    resource: string,
    details: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!user) return;

    logAuditEvent(
      user.id,
      `${user.firstName} ${user.lastName}`,
      user.role,
      action,
      resource,
      details,
      resourceId,
      metadata
    );
  }, [user]);

  return { log };
};
