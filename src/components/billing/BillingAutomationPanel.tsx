import { useState } from 'react';
import { apiRequest } from '@/api/https';
import { useProperties } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

interface Line { type: string; description: string; amount: number; waterReadingId?: number }
interface Preview {
  leaseId: number; tenantId: number; unitId: number; unitNumber: string;
  propertyName: string; year: number; month: number;
  newCharges: number; existingUnpaidBalance: number; totalPayable: number;
  warning?: string; alreadyIssued: boolean; requiresReview: boolean; lines: Line[];
}
interface Props { onIssued: () => Promise<void> }
const currency = (amount:number) => new Intl.NumberFormat('en-KE', {
  style:'currency', currency:'KES', minimumFractionDigits:2
}).format(Number(amount||0));

export function BillingAutomationPanel({ onIssued }: Props) {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const today = new Date();
  const [period, setPeriod] = useState(
    `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`);
  const [propertyId, setPropertyId] = useState('');
  const [preview, setPreview] = useState<Preview[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmIssue, setConfirmIssue] = useState(false);
  const params = () => {
    const [year, month] = period.split('-').map(Number);
    if (!year || !month || month < 1 || month > 12) throw new Error('Select a valid billing month');
    return `year=${year}&month=${month}${propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : ''}`;
  };
  const load = async () => {
    setBusy(true); setError(''); setConfirmIssue(false);
    try {
      const rows = await apiRequest<null,Preview[]>({
        path:`/api/billing/consolidated/preview?${params()}`,method:'GET'
      });
      setPreview(rows);
    } catch (e) {setError(e instanceof Error?e.message:'Unable to preview invoices');}
    finally {setBusy(false);}
  };
  const issue = async () => {
    if (!confirmIssue) return;
    setBusy(true);setError('');
    try {
      const rows = await apiRequest<null,Preview[]>({
        path:`/api/billing/consolidated/issue?${params()}`,method:'POST'
      });
      setConfirmIssue(false);
      setPreview(null);
      await onIssued();
      setError(`Issued ${rows.length} consolidated invoice(s). Tenant app notices and email submissions are attempted after posting commits; check Notification Logs for outcomes. Existing rent invoices were skipped.`);
    } catch (e) {setError(e instanceof Error?e.message:'Invoice issue failed');}
    finally {setBusy(false);}
  };
  const ready = preview?.filter(p=>!p.alreadyIssued && !p.requiresReview && Number(p.newCharges)>0) ?? [];
  return <Card className="min-w-0 overflow-hidden">
    <CardHeader><CardTitle className="flex items-center gap-2">
      <FileText className="h-5 w-5 text-primary"/> Monthly Billing · Preview & Issue
    </CardTitle>
    <p className="text-sm text-muted-foreground">
      One invoice per active lease: current-month rent plus approved previous-month water.
      Existing unpaid invoices remain separate ledger balances to avoid duplicate charges. Successful issuance sends a tenant portal notification and email after database commit.
    </p></CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-sm">Billing month
          <Input type="month" value={period} onChange={e=>{setPeriod(e.target.value);setPreview(null);}}/>
        </label>
        <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-sm">Property
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={propertyId}
            disabled={propertiesLoading || busy}
            onChange={e=>{setPropertyId(e.target.value);setPreview(null);setConfirmIssue(false);}}>
            <option value="">All permitted properties</option>
            {properties.map(property=><option key={property.id} value={String(property.id)}>{property.name}</option>)}
          </select>
        </label>
        <Button className="self-end" variant="outline" disabled={busy} onClick={()=>void load()}>
          Preview invoices
        </Button>
      </div>
      {error && <p role="status" className="rounded-md border p-3 text-sm break-words">{error}</p>}
      {preview && <div className="space-y-3">
        <p className="text-sm font-medium">
          {ready.length} ready to issue · {preview.length-ready.length} skipped or already billed
        </p>
        {preview.length===0 && <p className="text-sm text-muted-foreground">No active leases in this scope.</p>}
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {preview.map(row=><div key={row.leaseId} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <strong className="break-words">{row.propertyName} / {row.unitNumber}</strong>
              <span className="font-semibold">{currency(row.newCharges)} new charges</span>
            </div>
            {row.lines.map((line,index)=><div key={index} className="flex justify-between gap-2 text-muted-foreground">
              <span className="break-words">{line.description}</span>
              <span className="shrink-0">{currency(line.amount)}</span>
            </div>)}
            <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
              Existing unpaid: {currency(row.existingUnpaidBalance)} · Account total at preview: {currency(row.totalPayable)}
            </div>
            {row.warning && <p className="mt-1 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0"/>{row.warning}
            </p>}
          </div>)}
        </div>
        {ready.length>0 && <div className="space-y-2 rounded-md border p-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={confirmIssue} onChange={e=>setConfirmIssue(e.target.checked)}
              className="mt-1"/>
            I have reconciled existing invoices and approved meter readings. Issue and notify tenants about these
            new charges to the tenants shown above.
          </label>
          <Button disabled={!confirmIssue || busy} onClick={()=>void issue()}>
            <CheckCircle2 className="mr-2 h-4 w-4"/>Issue {ready.length} invoice(s)
          </Button>
        </div>}
      </div>}
      <p className="text-xs text-muted-foreground">
        Scheduled monthly posting is disabled by default until reconciliation is complete.
        When enabled for an individual property and at deployment level, the backend retries daily at 6 AM Kenya time.
      </p>
    </CardContent>
  </Card>;
}
