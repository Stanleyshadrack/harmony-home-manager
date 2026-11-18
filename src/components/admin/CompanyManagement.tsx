import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, RefreshCw, Search } from 'lucide-react';
import { apiRequest } from '@/api/https';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';

type Company = {
  id: number;
  name: string;
  numberOfLandlords: number;
  numberOfProperties: number;
  subscriptionId: number | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  createdAt: string | null;
};

const COMPANY_API = '/v1/api/companies';

export function CompanyManagement() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useViewMode('admin-companies', 'list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<null, Company[]>({path: COMPANY_API, method:'GET'});
      setCompanies(data);
      setError('');
    } catch(e) {
      setError(e instanceof Error ? e.message : 'Could not load companies');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createCompany() {
    const name = companyName.trim();
    if (!name || name.length > 180 || saving) return;
    setSaving(true);
    try {
      const created = await apiRequest<{name:string},Company>({
        path: COMPANY_API, method:'POST', body:{name}
      });
      setCompanies(previous => [created,...previous.filter(company => company.id !== created.id)]);
      setCompanyName('');
      setDialogOpen(false);
      toast({title:'Company created',description:`${created.name} has been created with its BASIC subscription.`});
      void load();
    } catch(e) {
      toast({title:'Company creation failed',
        description:e instanceof Error ? e.message : 'Could not create company',
        variant:'destructive'});
    } finally {setSaving(false);}
  }

  const visible = companies.filter(company => company.name.toLowerCase().includes(search.trim().toLowerCase()));

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">Companies</h2>
        <p className="text-sm text-muted-foreground">Create and manage company records. Every new company receives one BASIC subscription.</p>
      </div>
      <Button onClick={()=>setDialogOpen(true)}><Plus className="mr-2 h-4 w-4"/>Create Company</Button>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[180px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
        <Input className="pl-9" placeholder="Search companies" value={search}
          onChange={event=>setSearch(event.target.value)} />
      </div>
      <ViewModeToggle value={view} onChange={setView}/>
      <Button variant="outline" onClick={()=>void load()} disabled={loading}>
        <RefreshCw className="mr-2 h-4 w-4"/>Refresh
      </Button>
    </div>
    {loading && <p role="status" className="text-sm text-muted-foreground">Loading companies…</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!loading && !error && visible.length===0 && <p className="text-sm text-muted-foreground">No companies found.</p>}
    <div className={view === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
      {visible.map(company=><Card key={company.id}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base">
              <Building2 className="h-4 w-4 shrink-0"/><span className="break-words">{company.name}</span>
            </CardTitle>
            <Badge variant={company.subscriptionStatus === 'ACTIVE' ? 'secondary' : 'destructive'}>
              {company.subscriptionStatus ?? 'UNASSIGNED'}
            </Badge>
          </div>
          <CardDescription>Company #{company.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-muted-foreground">Landlords</p><p className="font-semibold">{company.numberOfLandlords}</p></div>
          <div><p className="text-muted-foreground">Properties</p><p className="font-semibold">{company.numberOfProperties}</p></div>
          <div><p className="text-muted-foreground">Plan</p><p className="font-semibold">{company.subscriptionPlan ?? '—'}</p></div>
          <div><p className="text-muted-foreground">Expires</p><p className="font-semibold">{company.subscriptionEndDate?.slice(0,10) ?? '—'}</p></div>
        </CardContent>
      </Card>)}
    </div>

    <Dialog open={dialogOpen} onOpenChange={open=>{if(!saving)setDialogOpen(open);}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Company</DialogTitle>
          <DialogDescription>Register a new company and automatically provision its BASIC subscription. Landlords can be associated afterward.</DialogDescription>
        </DialogHeader>
        <form onSubmit={event=>{event.preventDefault();void createCompany();}} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-company-name">Company name</Label>
            <Input id="new-company-name" autoFocus required maxLength={180}
              placeholder="e.g. Acme Property Management Ltd"
              value={companyName} onChange={event=>setCompanyName(event.target.value)}
              disabled={saving}/>
            <p className="text-xs text-muted-foreground">Each company name must be unique.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving}
              onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving||!companyName.trim()}>
              {saving?'Creating…':'Create company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
