import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTableView } from '@/components/ui/responsive-table-view';
import { Download, RefreshCw, Shield } from 'lucide-react';
import { apiRequest } from '@/api/https';
import { useAuth } from '@/contexts/AuthContext';

type LogEntry = {
  id: number; action: string; entityType: string; entityId: number | null;
  details: string | null; severity: string | null; ipAddress: string | null;
  userEmail: string | null; createdAt: string;
};

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useViewMode('auditlogs', 'list');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const load = async (nextPage = 0) => {
    setLoading(true);
    try {
      const response = await apiRequest<null, {
        content: LogEntry[]; number: number; last: boolean
      }>({path:`/api/audit-logs/mine?page=${nextPage}&size=50`, method:'GET'});
      setLogs(prev => nextPage === 0 ? response.content : [...prev, ...response.content]);
      setPage(response.number);
      setHasMore(!response.last);
      setError('');
    } catch(e) {
      if (nextPage === 0) setLogs([]);
      setError(e instanceof Error ? e.message : 'Unable to fetch audit events');
    } finally {setLoading(false);}
  };
  useEffect(() => {if(user?.id) void load();}, [user?.id,user?.role]);

  const filtered = useMemo(() => logs.filter(log => [
    log.action,log.entityType,log.details ?? '',log.userEmail ?? ''
  ].some(text => text.toLowerCase().includes(search.toLowerCase()))), [logs,search]);

  const exportCsv = () => {
    const escape = (v: unknown) => '"' + String(v ?? '').replace(/"/g,'""') + '"';
    const lines = [
      ['Date','Actor','Action','Severity','Entity','Details'].map(escape).join(','),
      ...filtered.map(l => [l.createdAt,l.userEmail,l.action,l.severity,
        l.entityType + (l.entityId == null ? '' : ' #' + l.entityId),l.details].map(escape).join(','))
    ];
    const url = URL.createObjectURL(new Blob(['\uFEFF',lines.join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href=url;
    link.download='audit-events.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  return <DashboardLayout title="Audit Logs"
    breadcrumbs={[{label:'Dashboard',href:'/dashboard'}, {label:'Audit Logs'}]}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Recorded system activity</h2>
          <p className="text-sm text-muted-foreground">
            {user?.role === 'super_admin' ? 'Recent persisted events across the system.' : 'Your own recorded events.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load(0)} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4"/>Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="mr-2 h-4 w-4"/>CSV
          </Button>
        </div>
      </div>
      <Card><CardContent className="flex items-center gap-3 p-4">
        <Shield className="h-5 w-5 text-primary"/>
        <span className="text-sm">{loading ? 'Loading audit records…' : `${logs.length} records loaded from the backend`}</span>
      </CardContent></Card>
      <div className="flex items-center justify-between gap-3">
        <Input value={search} onChange={e=>setSearch(e.target.value)}
          className="max-w-sm" placeholder="Search actor, action or details…" />
        <ViewModeToggle value={mode} onChange={setMode}/>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {!loading && !error && filtered.length===0 && <p className="text-sm text-muted-foreground">No matching audit events.</p>}
      <Card><CardContent className="p-3">
        <ResponsiveTableView mode={mode}>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Actor</TableHead>
              <TableHead>Action</TableHead><TableHead>Severity</TableHead>
              <TableHead>Entity</TableHead><TableHead>Details</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(log=><TableRow key={log.id}>
                <TableCell>{format(new Date(log.createdAt),'MMM d, yyyy HH:mm')}</TableCell>
                <TableCell className="break-all">{log.userEmail || 'System'}</TableCell>
                <TableCell>{log.action.replace(/_/g,' ')}</TableCell>
                <TableCell><Badge variant={log.severity?.toUpperCase() === 'CRITICAL' ? 'destructive':'secondary'}>
                  {log.severity || 'INFO'}
                </Badge></TableCell>
                <TableCell>{log.entityType}{log.entityId==null?'':` #${log.entityId}`}</TableCell>
                <TableCell className="break-words">{log.details || '—'}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </ResponsiveTableView>
      </CardContent></Card>
    </div>
  </DashboardLayout>;
}
