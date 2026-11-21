import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/api/https';
import { tokenService } from '@/services/tokenService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Eye, Loader2, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type AdvanceRow = {
  id:number; tenantId:number; tenantName:string; propertyId:number|null;
  propertyName:string; receipt:string|null; checkoutRequestId:string;
  expectedAmount:number; settledAmount:number; remainingAmount:number;
  allocatedAmount:number; status:'SUCCESS'|'PENDING'|'FAILED';
  createdAt:string; settledAt:string|null;
};
type Summary = {totalReceived:number; unallocated:number; allocated:number;
  pending:number; failed:number; successful:number; unassigned:number};
type Page = {content:AdvanceRow[]; totalElements:number; totalPages:number; number:number};
type Allocation = {invoiceId:number;invoiceNumber:string;amount:number;allocatedAt:string};
type Detail = {payment:AdvanceRow;allocations:Allocation[]};
const cash = (value:number) => new Intl.NumberFormat('en-KE', {
  style:'currency', currency:'KES',
}).format(Number(value||0));
const date = (value:string|null) => value
  ? new Date(value).toLocaleString('en-KE', {dateStyle:'medium', timeStyle:'short'}) : '—';
const badge = (status:AdvanceRow['status']) => status === 'SUCCESS'
  ? 'Confirmed' : status === 'PENDING' ? 'Pending' : 'Failed';

export function AdvancePaymentsRegister() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page|null>(null);
  const [summary, setSummary] = useState<Summary|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<number|null>(null);
  const [detail, setDetail] = useState<Detail|null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const query = useMemo(() => {
    const q = new URLSearchParams({page:String(page),size:'20'});
    if (search) q.set('search',search);
    if (status !== 'ALL') q.set('status',status);
    if (from) q.set('from',from);
    if (to) q.set('to',to);
    return q;
  },[page,search,status,from,to]);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [next, totals] = await Promise.all([
        apiRequest<null,Page>({path:`/api/billing/advances?${query.toString()}`,method:'GET'}),
        apiRequest<null,Summary>({path:'/api/billing/advances/summary',method:'GET'}),
      ]);
      setData(next); setSummary(totals);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load advance payments');
      setData(null);
    } finally { setLoading(false); }
  },[query]);
  useEffect(() => { void load(); },[load]);

  useEffect(() => {
    if (selected == null) { setDetail(null); return; }
    let alive = true;
    setDetail(null);setDetailLoading(true);
    void apiRequest<null,Detail>({path:`/api/billing/advances/${selected}`,method:'GET'})
      .then(result => {if (alive) setDetail(result);})
      .catch(e => {if (alive) toast({title:'Unable to open payment', description:
        e instanceof Error?e.message:'Please try again',variant:'destructive'});})
      .finally(() => {if (alive) setDetailLoading(false);});
    return () => {alive = false;};
  },[selected,toast]);

  async function download() {
    setExporting(true);
    try {
      const token = tokenService.getAccessToken();
      if (!token) throw new Error('Sign in to export the register');
      const q = new URLSearchParams(query);
      q.delete('page');q.delete('size');
      const response = await fetch(`/api/billing/advances/export?${q.toString()}`,{
        headers:{Authorization:`Bearer ${token}`},
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Could not export advance payments');
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'tenant-advance-payments.csv';
      document.body.appendChild(link);link.click();link.remove();
      URL.revokeObjectURL(objectUrl);
      toast({title:'Advance payments exported'});
    } catch(e) {
      toast({title:'Export failed',description:e instanceof Error?e.message:'Try again',
        variant:'destructive'});
    } finally {setExporting(false);}
  }

  return <div className="space-y-4">
    <div>
      <h2 className="text-xl font-semibold">Advance Payments & Tenant Credits</h2>
      <p className="text-sm text-muted-foreground">
        {user?.role === 'super_admin'
          ? 'Track all tenant prepayments, including unassigned credits requiring reconciliation.'
          : 'Track confirmed, pending and failed prepayments for your properties.'}
      </p>
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {([
        ['Confirmed funds', summary?.totalReceived],
        ['Available credit',summary?.unallocated],
        ['Applied to invoices',summary?.allocated],
        ['Pending requests',summary?.pending],
      ] as const).map(([name,value]) => <Card key={name}>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{name}</p>
          <p className="mt-1 text-lg font-semibold">
            {name === 'Pending requests' ? String(value??'—') : value == null?'—':cash(value)}
          </p>
        </CardContent>
      </Card>)}
    </div>
    {user?.role === 'super_admin' && summary && summary.unassigned > 0 &&
      <p role="status" className="rounded-md border p-3 text-sm">
        {summary.unassigned} unassigned payment record(s) need review. Unassigned credit
        is never allocated across landlords automatically.
      </p>}
    <Card><CardContent className="space-y-3 p-4">
      <form onSubmit={e=>{e.preventDefault();setPage(0);setSearch(searchText.trim());}}
        className="flex flex-wrap items-end gap-2">
        <label className="min-w-[180px] flex-1 space-y-1 text-sm">
          Search tenant or M-Pesa receipt
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
            <Input className="pl-8" value={searchText}
              onChange={e=>setSearchText(e.target.value)}
              placeholder="Tenant name or receipt"/>
          </div>
        </label>
        <label className="min-w-[120px] space-y-1 text-sm">Status
          <Select value={status} onValueChange={v=>{setStatus(v);setPage(0);}}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="SUCCESS">Confirmed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1 text-sm">From
          <Input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPage(0);}}/>
        </label>
        <label className="space-y-1 text-sm">To
          <Input type="date" value={to} onChange={e=>{setTo(e.target.value);setPage(0);}}/>
        </label>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.totalElements} visible payment(s)` : 'Loading payments'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={()=>void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading?'animate-spin':''}`}/> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={()=>void download()} disabled={exporting||loading}>
            {exporting?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Download className="mr-2 h-4 w-4"/>}
            Export CSV
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[950px] text-sm">
          <thead className="bg-muted/40">
            <tr>{['Date','Tenant','Property','M-Pesa receipt','Received','Allocated','Available','Status','Details']
                .map(h=><th key={h} className="p-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>{(data?.content??[]).map(row=><tr className="border-t" key={row.id}>
            <td className="whitespace-nowrap p-3">{date(row.settledAt||row.createdAt)}</td>
            <td className="p-3">{row.tenantName}<p className="text-xs text-muted-foreground">#{row.tenantId}</p></td>
            <td className="p-3">{row.propertyName}</td>
            <td className="p-3 font-mono text-xs">{row.receipt||'Awaiting confirmation'}</td>
            <td className="whitespace-nowrap p-3">{cash(row.settledAmount)}</td>
            <td className="whitespace-nowrap p-3">{cash(row.allocatedAmount)}</td>
            <td className="whitespace-nowrap p-3">{cash(row.remainingAmount)}</td>
            <td className="p-3"><Badge variant={row.status==='FAILED'?'destructive':'secondary'}>
              {badge(row.status)}</Badge></td>
            <td className="p-3">
              <Button variant="ghost" size="sm" onClick={()=>setSelected(row.id)}>
                <Eye className="mr-1 h-4 w-4"/> View
              </Button>
            </td>
          </tr>)}</tbody>
        </table>
        {!loading && data?.content.length===0 && <p className="p-4 text-sm text-muted-foreground">
          No advance payments match these filters.
        </p>}
      </div>
      <div className="flex items-center justify-end gap-3">
        <span className="text-sm text-muted-foreground">Page {page+1} of {Math.max(1,data?.totalPages||1)}</span>
        <Button variant="outline" size="sm" disabled={loading||page===0}
          onClick={()=>setPage(x=>x-1)}>Previous</Button>
        <Button variant="outline" size="sm"
          disabled={loading||!data||page+1>=data.totalPages}
          onClick={()=>setPage(x=>x+1)}>Next</Button>
      </div>
    </CardContent></Card>
    <Dialog open={selected!=null} onOpenChange={open=>{if(!open)setSelected(null);}}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Advance payment details</DialogTitle>
          <DialogDescription>Trace a confirmed M-Pesa receipt to invoice allocations.</DialogDescription>
        </DialogHeader>
        {detailLoading && <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin"/>Loading…</div>}
        {detail && <div className="space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-3">
            {([
              ['Tenant',detail.payment.tenantName],
              ['Property',detail.payment.propertyName],
              ['M-Pesa receipt',detail.payment.receipt||'Not confirmed'],
              ['Checkout request',detail.payment.checkoutRequestId],
              ['Expected amount',cash(detail.payment.expectedAmount)],
              ['Received',cash(detail.payment.settledAmount)],
              ['Applied',cash(detail.payment.allocatedAmount)],
              ['Available credit',cash(detail.payment.remainingAmount)],
              ['Status',badge(detail.payment.status)],
              ['Created',date(detail.payment.createdAt)],
            ] as const).map(([label,value])=><div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="break-all font-medium">{value}</dd>
            </div>)}
          </dl>
          <h3 className="font-semibold">Invoice allocations</h3>
          {detail.allocations.length===0
            ? <p className="text-muted-foreground">No funds have been applied to an invoice yet.</p>
            : <div className="space-y-2">{detail.allocations.map(a=>
                <div className="flex justify-between gap-3 rounded-md border p-3" key={a.invoiceId}>
                  <div><p>{a.invoiceNumber}</p><p className="text-xs text-muted-foreground">{date(a.allocatedAt)}</p></div>
                  <p className="font-medium">{cash(a.amount)}</p>
                </div>)}</div>}
        </div>}
      </DialogContent>
    </Dialog>
  </div>;
}
