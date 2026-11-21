import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/api/https';

export type FinancialSummary = {
  collected?: number | string | null;
  outstanding?: number | string | null;
  unallocatedCredit?: number | string | null;
  creditOffset?: number | string | null;
  netOutstanding?: number | string | null;
  units: number;
  occupiedUnits: number;
  maintenanceByStatus: Record<string, number>;
  properties: Array<{id: number}>;
};

export function financialNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatFinancialAmount(value: unknown): string {
  const number = financialNumber(value);
  return number === null ? '—' : `KES ${number.toLocaleString('en-KE', {maximumFractionDigits: 2})}`;
}

export function useFinancialSummary() {
  const { user } = useAuth();
  const enabled = Boolean(user?.id && (user.role === 'landlord' || user.role === 'super_admin'));
  // Both screens share the same user-scoped, server-authoritative query.
  // Never reconstruct arrears from wallet totals; the server owns offset eligibility.
  const query = useQuery({
    queryKey: ['financial-summary', user?.id, user?.role, 'month'],
    queryFn: () => apiRequest<null, FinancialSummary>({
      path: '/api/reports/summary?period=month', method: 'GET',
    }),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    retry: 1,
  });
  const summary = enabled ? query.data ?? null : null;
  const missingFields = summary !== null && [
    summary.collected, summary.outstanding, summary.unallocatedCredit,
    summary.creditOffset, summary.netOutstanding,
  ].some(value => financialNumber(value) === null);
  const error = query.error instanceof Error ? query.error.message
    : query.isError ? 'Unable to load financial summary' : '';
  return {summary, loading: enabled && query.isPending, refreshing: enabled && query.isFetching,
    error, missingFields, refresh: query.refetch};
}
