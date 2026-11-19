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
