// Audit Logging Service - Frontend implementation ready for backend integration

export type AuditAction = 
  | 'login' | 'logout' | 'register'
  | 'create_property' | 'update_property' | 'delete_property'
  | 'create_unit' | 'update_unit' | 'delete_unit'
  | 'create_tenant' | 'update_tenant' | 'delete_tenant'
  | 'create_invoice' | 'update_invoice' | 'delete_invoice'
  | 'record_payment' | 'update_payment' | 'delete_payment'
  | 'create_maintenance' | 'update_maintenance' | 'assign_maintenance' | 'complete_maintenance'
  | 'send_message' | 'send_notification'
  | 'update_settings' | 'update_role'
  | 'view_report' | 'download_invoice';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  severity: AuditSeverity;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// Severity mapping for actions
const actionSeverity: Record<AuditAction, AuditSeverity> = {
  login: 'info',
  logout: 'info',
  register: 'info',
  create_property: 'info',
  update_property: 'info',
  delete_property: 'warning',
  create_unit: 'info',
  update_unit: 'info',
  delete_unit: 'warning',
  create_tenant: 'info',
  update_tenant: 'info',
  delete_tenant: 'warning',
  create_invoice: 'info',
  update_invoice: 'info',
  delete_invoice: 'warning',
  record_payment: 'info',
  update_payment: 'warning',
  delete_payment: 'critical',
  create_maintenance: 'info',
  update_maintenance: 'info',
  assign_maintenance: 'info',
  complete_maintenance: 'info',
  send_message: 'info',
  send_notification: 'info',
  update_settings: 'warning',
  update_role: 'critical',
  view_report: 'info',
  download_invoice: 'info',
};

// Get audit logs from localStorage
export const getAuditLogs = (): AuditLog[] => {
  const logs = localStorage.getItem('audit_logs');
  if (!logs) return [];
  return JSON.parse(logs).map((log: AuditLog) => ({
    ...log,
    timestamp: new Date(log.timestamp),
  }));
};

// Save audit log
export const logAuditEvent = (
  userId: string,
  userName: string,
  userRole: string,
  action: AuditAction,
  resource: string,
  details: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): AuditLog => {
  const log: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    userId,
    userName,
    userRole,
    action,
    severity: actionSeverity[action],
    resource,
    resourceId,
    details,
    userAgent: navigator.userAgent,
    metadata,
  };

  const logs = getAuditLogs();
  logs.unshift(log);
  // Keep only last 500 logs
  localStorage.setItem('audit_logs', JSON.stringify(logs.slice(0, 500)));

  // Log critical events to console as well
  if (log.severity === 'critical') {
    console.warn('[AUDIT CRITICAL]', log);
  }

  return log;
};

// Filter audit logs
export const filterAuditLogs = (filters: {
  userId?: string;
  action?: AuditAction;
  severity?: AuditSeverity;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}): AuditLog[] => {
  let logs = getAuditLogs();

  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }
  if (filters.action) {
    logs = logs.filter(log => log.action === filters.action);
  }
  if (filters.severity) {
    logs = logs.filter(log => log.severity === filters.severity);
  }
  if (filters.resource) {
    logs = logs.filter(log => log.resource.toLowerCase().includes(filters.resource.toLowerCase()));
  }
  if (filters.startDate) {
    logs = logs.filter(log => log.timestamp >= filters.startDate!);
  }
  if (filters.endDate) {
    logs = logs.filter(log => log.timestamp <= filters.endDate!);
  }

  return logs;
};

// Get activity summary
export const getActivitySummary = (days: number = 7): {
  totalActions: number;
  byAction: Record<string, number>;
  bySeverity: Record<AuditSeverity, number>;
  byUser: Record<string, number>;
} => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = getAuditLogs().filter(log => log.timestamp >= startDate);

  const byAction: Record<string, number> = {};
  const bySeverity: Record<AuditSeverity, number> = { info: 0, warning: 0, critical: 0 };
  const byUser: Record<string, number> = {};

  logs.forEach(log => {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    bySeverity[log.severity]++;
    byUser[log.userName] = (byUser[log.userName] || 0) + 1;
  });

  return {
    totalActions: logs.length,
    byAction,
    bySeverity,
    byUser,
  };
};

// Clear audit logs (admin only)
export const clearAuditLogs = (): void => {
  localStorage.removeItem('audit_logs');
};
