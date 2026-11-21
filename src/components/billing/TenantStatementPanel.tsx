import { useEffect, useState } from 'react';
import { apiRequest } from '@/api/https';
import { tokenService } from '@/services/tokenService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Entry = { date: string; kind: string; reference: string; description: string;
  debit: number; credit: number; balance: number };
type Statement = { tenantId: number; tenantName: string; openingBalance: number;
  totalDebits: number; totalCredits: number; closingBalance: number; entries: Entry[] };
const cash = (amount: number) => new Intl.NumberFormat('en-KE', {
  style: 'currency', currency: 'KES'
}).format(amount || 0);

export function TenantStatementPanel({ tenantId }: { tenantId?: number | string | null }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [statement, setStatement] = useState<Statement | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState('');
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const base = tenantId != null ? `/api/billing/statements/${encodeURIComponent(String(tenantId))}` : '';
  const url = base + (query ? `?${query}` : '');

  useEffect(() => {
    setStatement(null);
  }, [tenantId, from, to]);

  async function load() {
    if (!base) return;
    setBusy(true);
    setError('');
    try {
      setStatement(await apiRequest<null, Statement>({ path: url, method: 'GET' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load statement');
    } finally { setBusy(false); }
  }
  async function download() {
    if (!base) return;
    setDownloading(true);
    try {
      const token = tokenService.getAccessToken();
      if (!token) throw new Error('Sign in to download your statement');
      // Same-origin Next.js API proxy, with bearer auth for access control.
      const response = await fetch(base + '/download' + (query ? `?${query}` : ''), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.message || 'Statement download failed');
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `tenant-statement-${tenantId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      toast.success('Statement downloaded');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Download failed'); }
    finally { setDownloading(false); }
  }

  async function downloadPdf() {
    if (!base) return;
    setPdfBusy(true);
    try {
      const data = statement ?? await apiRequest<null, Statement>({
        path: url, method: 'GET'
      });
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const pdf = new jsPDF({ orientation: 'landscape' });
      pdf.setFontSize(18);
      pdf.text('Statement of Account', 14, 18);
      pdf.setFontSize(10);
      pdf.text(data.tenantName || 'Tenant', 14, 26);
      pdf.text(`Period: ${from || 'All dates'} to ${to || 'Present'}`, 14, 33);
      pdf.text(`Opening balance: ${cash(data.openingBalance)}`, 14, 41);
      pdf.text(`Charges: ${cash(data.totalDebits)}`, 95, 41);
      pdf.text(`Payments: ${cash(data.totalCredits)}`, 173, 41);
      pdf.text(`Closing balance: ${cash(data.closingBalance)}`, 14, 48);
      autoTable(pdf, {
        startY: 55,
        head: [['Date', 'Type', 'Reference', 'Description', 'Debit (KES)', 'Credit (KES)', 'Balance (KES)']],
        body: data.entries.map(e => [
          e.date, e.kind, e.reference, e.description,
          e.debit.toFixed(2), e.credit.toFixed(2), e.balance.toFixed(2)
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 56, 83] }
      });
      pdf.save(`tenant-statement-${tenantId}.pdf`);
      toast.success('PDF statement downloaded');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'PDF download failed'); }
    finally { setPdfBusy(false); }
  }

  return <Card>
    <CardHeader><CardTitle>Statement of Account</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review posted invoices and confirmed payments. Export a CSV for Excel.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm space-y-1">From
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </label>
        <label className="text-sm space-y-1">To
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </label>
        <Button variant="outline" onClick={() => void load()} disabled={!base || busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
          View statement
        </Button>
        <Button onClick={() => void download()} disabled={!base || downloading || busy}>
          {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
          Download CSV
        </Button>
        <Button variant="outline" onClick={() => void downloadPdf()}
          disabled={!base || pdfBusy || busy}>
          {pdfBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
          Download PDF
        </Button>
      </div>
      {!base && <p className="text-sm text-muted-foreground">Your account details are loading.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {statement && <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {([['Opening balance', statement.openingBalance],
             ['Charges', statement.totalDebits],
             ['Payments', statement.totalCredits],
             ['Closing balance', statement.closingBalance]] as const).map(([label, value]) =>
            <div key={label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold">{cash(value)}</p>
            </div>)}
        </div>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>{['Date','Type','Reference','Description','Debit','Credit','Balance'].map(x =>
                <th key={x} className="p-3 text-left">{x}</th>)}</tr>
            </thead>
            <tbody>
              {statement.entries.map((e,i) =>
                <tr key={e.reference + '-' + i} className="border-t">
                  <td className="p-3">{e.date}</td><td className="p-3">{e.kind}</td>
                  <td className="p-3">{e.reference}</td><td className="p-3">{e.description}</td>
                  <td className="p-3 whitespace-nowrap">{cash(e.debit)}</td>
                  <td className="p-3 whitespace-nowrap">{cash(e.credit)}</td>
                  <td className="p-3 whitespace-nowrap font-medium">{cash(e.balance)}</td>
                </tr>)}
            </tbody>
          </table>
          {!statement.entries.length && <p className="p-4 text-sm text-muted-foreground">No transactions in this period.</p>}
        </div>
      </>}
    </CardContent>
  </Card>;
}
