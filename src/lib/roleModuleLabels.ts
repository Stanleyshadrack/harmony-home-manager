import type { UserRole } from '@/contexts/AuthContext';

/** Navigation labels describe the API scope, never grant permissions. */
const scopedLabels: Record<string, { landlord?: string; employee?: string; tenant?: string }> = {
  '/properties': { landlord: 'My Properties' },
  '/assigned-properties': { employee: 'Assigned Properties' },
  '/units': { landlord: 'My Units', employee: 'Assigned Units', tenant: 'My Unit' },
  '/tenants': { landlord: 'My Tenants', employee: 'Assigned Tenants' },
  '/employees': { landlord: 'My Employees' },
  '/billing': { landlord: 'My Billing', employee: 'Assigned Billing', tenant: 'My Invoices' },
  '/subscription-plans': { landlord: 'My Subscription' },
  '/water-data': { landlord: 'My Water Data', employee: 'Assigned Water Data', tenant: 'My Water Usage' },
  '/water-meters': { landlord: 'My Water Meters' },
  '/maintenance': { landlord: 'My Maintenance', employee: 'Assigned Maintenance', tenant: 'My Maintenance' },
  '/reports': { landlord: 'My Reports' },
  '/notifications': { landlord: 'My Notifications' },
  '/notification-logs': { landlord: 'My Notification Logs' },
  '/audit-logs': { landlord: 'My Activity' },
  '/messages': { landlord: 'My Messages', employee: 'My Messages', tenant: 'My Messages' },
};

export function getRoleModuleLabel(path: string, role: UserRole, fallback: string): string {
  if (role === 'super_admin') return fallback;
  return scopedLabels[path]?.[role] ?? fallback;
}
