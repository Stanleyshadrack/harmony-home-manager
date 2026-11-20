import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/api/https';
import { useAuth } from '@/contexts/AuthContext';
import type { Invoice } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Result = { sent: number; failed: number; skipped: number; failedInvoiceIds: number[]; emailAccepted: number; inAppCreated: number };
type Channel = "BOTH" | "IN_APP" | "EMAIL";

export function InvoiceDispatchPanel({ invoices }: { invoices: Invoice[] }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [channel, setChannel] = useState<Channel>("BOTH");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const eligible = useMemo(() => invoices.filter(i => i.status !== 'cancelled'), [invoices]);
  const ids = useMemo(() => new Set(eligible.map(i => i.id)), [eligible]);
  useEffect(() => {
    setSelected(current => {
      const kept = current.filter(id => ids.has(id));
      return kept.length === current.length ? current : kept;
    });
  }, [ids]);
  const allSelected = eligible.length > 0 && eligible.every(i => selected.includes(i.id));
  const toggle = (id: number) => {
    setConfirmed(false); setResult(null);
    setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };
  const send = async () => {
    if (!confirmed || busy || selected.length === 0) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await apiRequest<{ invoiceIds: number[]; channel: Channel }, Result>({
        path: '/api/billing/invoice/dispatch', method: 'POST', body: { invoiceIds: selected, channel }
      });
      setResult(response);
      setConfirmed(false);
      setSelected([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invoice dispatch failed');
    } finally { setBusy(false); }
  };
  if (user?.role !== 'super_admin' && user?.role !== 'landlord') return null;
  return <Card className="mb-5">
    <CardHeader className="flex flex-row items-center justify-between gap-3"><div><CardTitle className="text-base">Invoice delivery / resend</CardTitle>
      <p className="text-sm text-muted-foreground">Choose individual invoices or all invoices currently visible under the billing filters. Each recipient is checked by the backend. Email attempts and in-app dispatches appear in My Notification Logs.</p>
    </div><Button type="button" variant="outline" size="sm" aria-expanded={expanded}
      onClick={() => setExpanded(current => !current)}>{expanded ? "Hide dispatch" : "Send / resend invoices"}</Button></CardHeader>
    {expanded && <CardContent className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={allSelected} disabled={busy || !eligible.length}
          onChange={e => { setSelected(e.target.checked ? eligible.map(i=>i.id) : []); setConfirmed(false); setResult(null); }} />
        Select all {eligible.length} visible non-cancelled invoices
      </label>
      <div className="max-h-52 overflow-y-auto rounded border divide-y">
        {eligible.map(i => <label key={i.id} className="flex items-start gap-3 p-2 text-sm">
          <input type="checkbox" checked={selected.includes(i.id)} disabled={busy}
            onChange={() => toggle(i.id)} />
          <span className="min-w-0"><strong>{i.invoiceNumber}</strong> — {i.tenantName || 'Tenant'} · {i.propertyName} · outstanding KES {Number(i.balance || 0).toLocaleString('en-KE')}</span>
        </label>)}
        {!eligible.length && <p className="p-3 text-sm text-muted-foreground">No invoices available in the current filter.</p>}
      </div>
      <label className="flex max-w-sm flex-col gap-1 text-sm font-medium">Delivery channel
        <select className="h-10 rounded-md border bg-background px-3" value={channel}
          disabled={busy} onChange={e => { setChannel(e.target.value as Channel); setConfirmed(false); setResult(null); }}>
          <option value="BOTH">In-app + Email</option>
          <option value="IN_APP">In-app only</option>
          <option value="EMAIL">Email only</option>
        </select>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={confirmed} disabled={!selected.length || busy}
          onChange={e => setConfirmed(e.target.checked)}/>
        I confirm these {selected.length} invoice(s) should be dispatched via the selected channel(s).
      </label>
      <Button disabled={!confirmed || !selected.length || busy} onClick={() => void send()}>
        {busy ? 'Dispatching…' : `Dispatch ${selected.length} invoice(s)`}
      </Button>
      {result && <p role="status" className="text-sm">Completed all selected channels: {result.sent}; SMTP accepted: {result.emailAccepted}; in-app notifications: {result.inAppCreated}; failed invoices: {result.failed}; skipped: {result.skipped}. {result.failedInvoiceIds.length ? `Failed invoice IDs: ${result.failedInvoiceIds.join(', ')}` : ''}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </CardContent>}
  </Card>;
}
