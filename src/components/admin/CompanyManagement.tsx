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


  const activeCount = companies.filter(company => company.subscriptionStatus === 'ACTIVE').length;
  const totalProperties = companies.reduce((sum, company) => sum + (company.numberOfProperties ?? 0), 0);
  const expiringSoon = companies.filter(company => {
    if (company.subscriptionStatus !== 'ACTIVE' || !company.subscriptionEndDate) return false;
    const days = (new Date(company.subscriptionEndDate).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  }).length;

  const statusBadge = (company: Company) => (
    <Badge variant={company.subscriptionStatus === 'ACTIVE' ? 'secondary' : 'destructive'} className="shrink-0">
      {company.subscriptionStatus ?? 'UNASSIGNED'}
    </Badge>
  );

  return (
    <section className="min-w-0 space-y-5">
      {/* Section header and primary action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Companies</h2>
          <p className="text-sm text-muted-foreground">
            Manage your companies, their associated landlords and subscription status.
          </p>
        </div>
        <Button className="w-full shrink-0 sm:w-auto" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Company
        </Button>
      </div>

      {/* Compact, real-time summary based on the loaded company list */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total companies', value: companies.length },
          { label: 'Active subscriptions', value: activeCount },
          { label: 'Expiring within 30 days', value: expiringSoon },
          { label: 'Total properties', value: totalProperties },
        ].map(metric => (
          <Card key={metric.label} className="min-w-0">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {loading && companies.length === 0 ? '…' : metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and display controls */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by company name" value={search}
            aria-label="Search companies"
            onChange={event => setSearch(event.target.value)} />
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="whitespace-nowrap text-xs text-muted-foreground">{visible.length} shown</span>
          <ViewModeToggle value={view} onChange={setView} />
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-muted-foreground">Loading companies…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Building2 className="h-9 w-9 text-muted-foreground" />
            <p className="font-medium">{search ? 'No matching companies' : 'No companies yet'}</p>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term.' : 'Create your first company to get started.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Separate, purpose-built grid cards */}
      {!loading && !error && view === 'grid' && visible.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(company => (
            <Card key={company.id} className="flex min-w-0 flex-col transition-colors hover:border-primary/40">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="break-words text-base leading-6">{company.name}</CardTitle>
                      <CardDescription>Company #{company.id}</CardDescription>
                    </div>
                  </div>
                  {statusBadge(company)}
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 pt-0">
                {[
                  { label: 'Landlords', value: company.numberOfLandlords ?? 0 },
                  { label: 'Properties', value: company.numberOfProperties ?? 0 },
                  { label: 'Subscription', value: company.subscriptionPlan ?? '—' },
                  { label: 'Expires', value: company.subscriptionEndDate?.slice(0, 10) ?? '—' },
                ].map(item => (
                  <div key={item.label} className="min-w-0 rounded-md border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 break-words text-sm font-semibold tabular-nums">{item.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List mode is a true compact comparison table, not stretched cards */}
      {!loading && !error && view === 'list' && visible.length > 0 && (
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Company</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 text-center font-medium">Landlords</th>
                  <th scope="col" className="px-4 py-3 text-center font-medium">Properties</th>
                  <th scope="col" className="px-4 py-3 font-medium">Plan</th>
                  <th scope="col" className="px-4 py-3 font-medium">Expiry date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map(company => (
                  <tr key={company.id} className="transition-colors hover:bg-muted/30">
                    <td className="max-w-[260px] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="break-words font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground">Company #{company.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(company)}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{company.numberOfLandlords ?? 0}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{company.numberOfProperties ?? 0}</td>
                    <td className="px-4 py-3 font-medium">{company.subscriptionPlan ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{company.subscriptionEndDate?.slice(0, 10) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Preserve the existing real company creation workflow */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!saving) setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Company</DialogTitle>
            <DialogDescription>
              Register a new company with an automatically provisioned BASIC subscription.
              You can associate landlords after creation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={event => { event.preventDefault(); void createCompany(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-company-name">Company name</Label>
              <Input id="new-company-name" autoFocus required maxLength={180}
                placeholder="e.g. Acme Property Management Ltd"
                value={companyName} onChange={event => setCompanyName(event.target.value)}
                disabled={saving} />
              <p className="text-xs text-muted-foreground">Each company name must be unique.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={saving}
                onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !companyName.trim()}>
                {saving ? 'Creating…' : 'Create company'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
