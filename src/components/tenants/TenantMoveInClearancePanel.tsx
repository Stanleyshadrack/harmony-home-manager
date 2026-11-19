import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/api/https';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export type MoveInStep = { key: string; label: string; complete: boolean; detail: string };
export type MoveInClearance = {
  tenantId: number;
  leaseId: number;
  unitId: number;
  unitNumber: string;
  propertyName: string;
  stage: string;
  ready: boolean;
  cleared: boolean;
  clearedAt?: string | null;
  checklist: MoveInStep[];
};

/** Landlord and tenant view the same server-authoritative checklist.
 * A tenant can view their own clearance but cannot confirm possession. */
export function TenantMoveInClearancePanel({
  tenantId, tenantView = false,
}: { tenantId?: number | string | null; tenantView?: boolean }) {
  const { toast } = useToast();
  const [record, setRecord] = useState<MoveInClearance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endpoint = tenantView
    ? '/api/tenants/me/move-in-clearance'
    : `/api/tenants/${tenantId}/move-in-clearance`;

  const refresh = useCallback(async () => {
    if (!tenantView && !tenantId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<null, MoveInClearance>({path: endpoint, method: 'GET'});
      setRecord(result);
    } catch (e) {
      setRecord(null);
      setError(e instanceof Error ? e.message : 'Unable to load clearance status');
    } finally {
      setLoading(false);
    }
  }, [endpoint, tenantId, tenantView]);

  useEffect(() => { void refresh(); }, [refresh]);

  const completedSteps = record?.checklist.filter(step => step.complete).length ?? 0;
  const totalSteps = record?.checklist.length ?? 0;
  const progress = totalSteps ? Math.round(completedSteps / totalSteps * 100) : 0;
  const nextStep = record?.checklist.find(step => !step.complete);
  const leaseApproved = record?.checklist.some(step => step.key === 'LEASE_APPROVED' && step.complete);
  const firstRentIssued = record?.checklist.some(step => step.key === 'FIRST_RENT_ISSUED' && step.complete);
  const depositIncluded = record?.checklist.some(step => step.key === 'DEPOSIT_INVOICED' && step.complete);

  const issueFirstRent = async () => {
    if (!tenantId || tenantView || !leaseApproved || (firstRentIssued && depositIncluded) || busy) return;
    if (!window.confirm(firstRentIssued
      ? 'Add the missing refundable deposit to this existing unpaid first-rent invoice? This preserves its invoice number and requires no prior payment activity.'
      : 'Create one first invoice showing monthly rent and refundable deposit separately?')) return;
    setBusy(true);
    try {
      const result = await apiRequest<null, MoveInClearance>({
        path: `/api/tenants/${tenantId}/move-in-clearance/first-rent`, method: 'POST',
      });
      setRecord(result);
      toast({title: 'First invoice updated',
        description: 'The bill now itemizes rent and refundable deposit. Confirm actual payment through Billing before clearing move-in.'});
    } catch (e) {
      toast({title: 'Could not issue first rent',
        description: e instanceof Error ? e.message : 'Please review the lease and existing invoices.',
        variant: 'destructive'});
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!record || !record.ready || record.cleared || busy || !tenantId) return;
    if (!window.confirm(
      `Confirm move-in clearance for Unit ${record.unitNumber}? This will mark the unit occupied. Confirm documents, deposit and first rent are settled.`
    )) return;
    setBusy(true);
    try {
      const result = await apiRequest<null, MoveInClearance>({
        path: `/api/tenants/${tenantId}/move-in-clearance/confirm`,
        method: 'POST',
      });
      setRecord(result);
      toast({title: 'Move-in clearance recorded',
        description: `Unit ${result.unitNumber} is now occupied and the clearance timestamp has been saved.`});
    } catch (e) {
      toast({title: 'Clearance blocked',
        description: e instanceof Error ? e.message : 'Required checks are incomplete',
        variant: 'destructive'});
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5" /> Move-in clearance
          </CardTitle>
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading || busy}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p className="text-sm text-muted-foreground" role="status">Checking the tenant journey…</p>}
        {!loading && error && (
          <div role="alert" className="rounded-lg border p-3 text-sm">
            <p className="font-medium">Clearance status unavailable</p>
            <p className="mt-1 break-words text-muted-foreground">{error}</p>
          </div>
        )}
        {!loading && record && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-3">
              <div>
                <p className="font-semibold">Unit {record.unitNumber}</p>
                <p className="text-xs text-muted-foreground">{record.propertyName}</p>
              </div>
              <Badge variant={record.cleared ? 'default' : 'outline'}>
                {record.cleared ? 'Cleared to move in'
                  : record.ready ? 'Ready for final confirmation' : 'Checks outstanding'}
              </Badge>
            </div>
            <section className="space-y-2" aria-label="Tenant onboarding progress">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">Journey progress</span>
                <span className="tabular-nums text-muted-foreground">{completedSteps} of {totalSteps} checks complete ({progress}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar"
                aria-valuenow={completedSteps} aria-valuemin={0} aria-valuemax={totalSteps || 1}>
                <div className="h-full rounded-full bg-primary transition-all" style={{width: `${progress}%`}} />
              </div>
              <p className="text-xs text-muted-foreground">
                Invitation accepted and onboarding submitted → tenant verification → document reviews →
                lease approval → deposit and first rent → landlord clearance.
              </p>
              {!record.cleared && nextStep && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                  <p className="font-medium">Next outstanding step: {nextStep.label}</p>
                  <p className="mt-1 text-muted-foreground">{nextStep.detail}</p>
                </div>
              )}
            </section>
            <div className="space-y-2">
              {record.checklist.map(step => (
                <div key={step.key} className="flex items-start gap-2.5 rounded-md border px-3 py-2.5">
                  {step.complete
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    : <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            {record.cleared && record.clearedAt && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 inline h-4 w-4" />
                Cleared on {new Date(record.clearedAt).toLocaleString('en-KE')}
              </p>
            )}
            {tenantView ? (
              <p className="flex gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Clearance is completed by the landlord after verifying the checklist. Do not move in until it is confirmed.
              </p>
            ) : (
              <div className="space-y-2">
                {leaseApproved && (!firstRentIssued || !depositIncluded) && !record.cleared && (
                  <Button className="w-full" variant="outline" onClick={issueFirstRent}
                    disabled={busy}>
                    {busy ? 'Saving…' : firstRentIssued ? 'Add missing deposit to first invoice' : 'Issue rent + deposit invoice'}
                  </Button>
                )}
                <Button className="w-full" onClick={confirm}
                  disabled={!record.ready || record.cleared || busy}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {record.cleared ? 'Move-in already cleared' :
                    busy ? 'Confirming…' : 'Confirm clearance & mark occupied'}
                </Button>
                {!record.ready && <p className="text-xs text-muted-foreground">
                  Final confirmation is unavailable until every check passes. Document approval and
                  verified initial payments are required.
                </p>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
