import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

export type UserRole = 'super_admin' | 'landlord' | 'employee' | 'tenant';

export type Permission = 
  | 'manage_landlords' | 'manage_subscriptions' | 'view_all_audit_logs'
  | 'manage_properties' | 'manage_units' | 'manage_tenants' | 'manage_employees'
  | 'set_rates' | 'approve_applications' | 'view_reports' | 'view_dashboard'
  | 'read_meters' | 'handle_maintenance' | 'chat_with_tenants'
  | 'apply_for_unit' | 'pay_bills' | 'submit_requests' | 'view_documents' | 'send_messages';

// Role-Permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    'manage_landlords', 'manage_subscriptions', 'view_all_audit_logs',
    'manage_properties', 'manage_units', 'manage_tenants', 'manage_employees',
    'set_rates', 'approve_applications', 'view_reports', 'view_dashboard',
    'read_meters', 'handle_maintenance', 'chat_with_tenants',
    'apply_for_unit', 'pay_bills', 'submit_requests', 'view_documents', 'send_messages',
  ],
  landlord: [
    'manage_properties', 'manage_units', 'manage_tenants', 'manage_employees',
    'set_rates', 'approve_applications', 'view_reports', 'view_dashboard',
    'handle_maintenance', 'chat_with_tenants', 'send_messages',
  ],
  employee: [
    'read_meters', 'handle_maintenance', 'chat_with_tenants', 'send_messages',
    'view_dashboard',
  ],
  tenant: [
    'apply_for_unit', 'pay_bills', 'submit_requests', 'view_documents', 'send_messages',
    'view_dashboard',
  ],
};

interface RBACContextType {
  role: UserRole;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// Route access mapping
const routePermissions: Record<string, Permission[]> = {
  '/dashboard': ['view_dashboard'],
  '/properties': ['manage_properties'],
  '/units': ['manage_units'],
  '/tenants': ['manage_tenants'],
  '/billing': ['manage_tenants', 'pay_bills'],
  '/maintenance': ['handle_maintenance', 'submit_requests'],
  '/messages': ['send_messages'],
  '/reports': ['view_reports'],
  '/settings': ['manage_properties'], // Basic access for landlords+
  '/audit-logs': ['view_all_audit_logs'],
};

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const role: UserRole = (user?.role as UserRole) || 'tenant';
  const permissions = rolePermissions[role];

  const value = useMemo(() => ({
    role,
    permissions,
    hasPermission: (permission: Permission) => permissions.includes(permission),
    hasAnyPermission: (perms: Permission[]) => perms.some(p => permissions.includes(p)),
    hasAllPermissions: (perms: Permission[]) => perms.every(p => permissions.includes(p)),
    canAccessRoute: (route: string) => {
      const requiredPerms = routePermissions[route];
      if (!requiredPerms) return true; // No restrictions
      return requiredPerms.some(p => permissions.includes(p));
    },
  }), [role, permissions]);

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

// Permission guard component
export const PermissionGate: React.FC<{
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, permissions, requireAll = false, fallback = null, children }) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRBAC();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
