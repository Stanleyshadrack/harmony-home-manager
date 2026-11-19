import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/api/https';
import { formatDistanceToNow } from 'date-fns';
import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';

type Event = {
  id: number; action: string; entityType: string;
  entityId: number | null; details: string | null; createdAt: string;
};

export default function RecentActivities() {
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useViewMode('recent-activities', 'list');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => items.filter(item =>
    [item.action, item.entityType, item.details || ''].some(value =>
      value.toLowerCase().includes(search.trim().toLowerCase()))), [items, search]);
  const load = async (nextPage = 0) => {
    setLoading(true);
    try {
      const data = await apiRequest<null, {content: Event[]; last: boolean; number: number}>({
        path: `/api/audit-logs/mine?page=${nextPage}&size=50`, method:'GET'
      });
      setItems(prev => nextPage === 0 ? data.content : [...prev, ...data.content]);
      setPage(data.number);
      setHasMore(!data.last);
      setError('');
    } catch (e) {
      if (nextPage === 0) setItems([]);
      setError(e instanceof Error ? e.message : 'Unable to load activity history');
    } finally { setLoading(false); }
  };
  useEffect(() => {void load();}, []);

  return <DashboardLayout title="Recent Activities"
    breadcrumbs={[{label:'Dashboard', href:'/dashboard'}, {label:'Recent Activities'}]}>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Recorded system actions from PostgreSQL, scoped to your account. Older actions can be loaded below.</p>
        <div className="flex items-center gap-2">
          <ViewModeToggle value={mode} onChange={setMode}/>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void load(0)}>
            <RefreshCw className="mr-2 h-4 w-4"/>Refresh
          </Button>
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter loaded actions, modules, or details" />
      </div>
      {loading && <p role="status" className="text-sm text-muted-foreground">Loading recent activity…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!loading && !error && filtered.length === 0 && <p className="text-sm text-muted-foreground">No recorded activity yet.</p>}
      <div className={mode === 'grid' ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
        {filtered.map(item => <Card key={item.id}><CardContent className="flex items-start gap-3 p-4">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary"/>
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{item.action.replace(/_/g, ' ')}</p>
            <p className="text-sm text-muted-foreground">{item.entityType}{item.entityId == null ? '' : ` #${item.entityId}`}</p>
            {item.details && <p className="text-sm break-words">{item.details}</p>}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), {addSuffix:true})}
            </p>
          </div>
        </CardContent></Card>)}
      </div>
      {hasMore && <div className="flex justify-center">
        <Button variant="outline" disabled={loading} onClick={() => void load(page + 1)}>
          {loading ? 'Loading…' : 'Load earlier activity'}
        </Button>
      </div>}
    </div>
  </DashboardLayout>;
}
