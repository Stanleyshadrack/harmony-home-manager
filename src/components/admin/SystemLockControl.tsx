import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel
} from '@/components/ui/alert-dialog';
import { Lock, Unlock, RefreshCw, Search, Mail, ShieldAlert } from 'lucide-react';
import { apiRequest } from '@/api/https';
import { announceMaintenanceChange, useSystemMaintenance } from '@/hooks/useSystemMaintenance';
import { useToast } from '@/hooks/use-toast';

type LockUser = { id: number; email: string; name: string; role: string; locked: boolean; reason: string | null };
type LockResult = { emailsQueued: number };
type GlobalResult = { status: {enabled:boolean;message:string}; emailsQueued:number };

export function SystemLockControl() {
  const {toast} = useToast();
  const {status, error, loading, refresh} = useSystemMaintenance();
  const [users, setUsers] = useState<LockUser[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [reason, setReason] = useState('Scheduled maintenance. Please try again later.');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{kind:'global'|'user'|'bulk'; enabled:boolean; user?:LockUser} | null>(null);
  const [usersError, setUsersError] = useState('');

  async function loadUsers() {
    try {
      const result = await apiRequest<null, LockUser[]>({
        path:'/api/system-maintenance/users',method:'GET'
      });
      setUsers(result);
      setUsersError('');
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : 'Could not load user accounts');
    }
  }
  useEffect(() => {void loadUsers();}, []);
  useEffect(() => { if (status.message) setReason(status.message); }, [status.message]);

  async function apply() {
    if (!confirm || busy || !reason.trim() || reason.length > 1000) return;
    setBusy(true);
    try {
      let queued: number;
      if (confirm.kind === 'global') {
        const result = await apiRequest<{enabled:boolean;message:string}, GlobalResult>({
          path:'/api/system-maintenance',method:'PUT',
          body:{enabled:confirm.enabled,message:reason.trim()}
        });
        queued = result.emailsQueued;
        await refresh();
        announceMaintenanceChange();
      } else if (confirm.kind === 'bulk') {
        const result = await apiRequest<{userIds:number[]; enabled:boolean;message:string},LockResult>({
          path:'/api/system-maintenance/users/bulk', method:'PUT',
          body:{userIds:selected,enabled:confirm.enabled,message:reason.trim()}
        });
        queued = result.emailsQueued;
        setSelected([]);
      } else {
        const result = await apiRequest<{enabled:boolean;message:string}, LockResult>({
          path:`/api/system-maintenance/users/${confirm.user!.id}`, method:'PUT',
          body:{enabled:confirm.enabled,message:reason.trim()}
        });
        queued = result.emailsQueued;
      }
      await loadUsers();
      toast({title:'Access updated',description:
        `The lock state was saved. ${queued} email notification(s) queued for SMTP delivery.`});
      setConfirm(null);
    } catch(e) {
      toast({title:'Lock operation failed',description:e instanceof Error?e.message:'Unknown error',variant:'destructive'});
    } finally {setBusy(false);}
  }

  const visible = users.filter(u =>
    `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6">
    <Card className={status.enabled ? 'border-destructive' : ''}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5"/> Global System Lock</CardTitle>
          <Badge variant={status.enabled?'destructive':'secondary'}>
            {loading?'Checking…':status.enabled?'LOCKED':'OPERATIONAL'}
          </Badge>
        </div>
        <CardDescription>
          Live status is read from PostgreSQL. Locking the whole platform blocks all non-Super-Admin users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
        <div>
          <label className="text-sm font-medium" htmlFor="systemLockReason">Lock reason / user notification</label>
          <Textarea id="systemLockReason" maxLength={1000} rows={3} value={reason}
            onChange={e=>setReason(e.target.value)}/>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy||loading||!!error||!reason.trim()}
            variant={status.enabled?'default':'destructive'}
            onClick={()=>setConfirm({kind:'global',enabled:!status.enabled})}>
            {status.enabled?<Unlock className="mr-2 h-4 w-4"/>:<Lock className="mr-2 h-4 w-4"/>}
            {status.enabled?'Unlock entire system':'Lock entire system'}
          </Button>
          <Button variant="outline" disabled={busy} onClick={()=>void refresh()}>
            <RefreshCw className="mr-2 h-4 w-4"/> Refresh
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Emails are queued after a lock-state change. SMTP delivery is tracked and retried by the server;
          queuing an email is not proof that it reached the inbox.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Lock individual users</CardTitle>
        <CardDescription>
          Restrict or restore one specific account without affecting other users.
          Super Admin accounts are excluded from this list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
          <Input className="pl-9" placeholder="Search name, email or role" value={search}
            onChange={e=>setSearch(e.target.value)}/>
        </div>
        {usersError && <p role="alert" className="text-destructive text-sm">{usersError}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={()=>setSelected(visible.map(u=>u.id))}>
            Select matching ({visible.length})
          </Button>
          <Button size="sm" variant="ghost" onClick={()=>setSelected([])}>Clear selection</Button>
          <span className="text-xs text-muted-foreground">{selected.length} selected</span>
          <Button size="sm" variant="destructive" disabled={!selected.length||busy||!reason.trim()}
            onClick={()=>setConfirm({kind:'bulk',enabled:true})}>Lock selected</Button>
          <Button size="sm" variant="outline" disabled={!selected.length||busy||!reason.trim()}
            onClick={()=>setConfirm({kind:'bulk',enabled:false})}>Unlock selected</Button>
        </div>
        <div className="max-h-[450px] space-y-2 overflow-y-auto">
          {visible.map(u=><div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <Checkbox aria-label={`Select ${u.email}`} checked={selected.includes(u.id)}
              onCheckedChange={checked=>setSelected(prev=>checked
                ? [...prev.filter(id=>id!==u.id),u.id] : prev.filter(id=>id!==u.id))}/>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{u.name||u.email}</p>
              <p className="text-xs text-muted-foreground break-all">{u.email} · {u.role}</p>
              {u.locked && <p className="text-xs text-destructive">{u.reason}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={u.locked?'destructive':'secondary'}>{u.locked?'LOCKED':'ACTIVE'}</Badge>
              <Button size="sm" variant={u.locked?'outline':'destructive'}
                disabled={busy||!reason.trim()} onClick={()=>setConfirm({kind:'user',enabled:!u.locked,user:u})}>
                {u.locked?'Unlock':'Lock'}
              </Button>
            </div>
          </div>)}
          {visible.length===0 && !usersError && <p className="py-6 text-center text-sm text-muted-foreground">No matching users</p>}
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={!!confirm} onOpenChange={open=>{if(!open&&!busy)setConfirm(null)}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm?.enabled?'Confirm access lock':'Confirm access restoration'}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirm?.kind==='global'?'This changes access for every non-admin account.':
              confirm?.kind==='bulk' ? `This changes access for ${selected.length} selected accounts.` :
              `This changes access only for ${confirm?.user?.email || 'the selected user'}.`}
            {' '}A notification will be queued for each affected user.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap break-words">{reason}</div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button disabled={busy||!reason.trim()} variant={confirm?.enabled?'destructive':'default'}
            onClick={()=>void apply()}>
            {busy?'Updating…':confirm?.enabled?'Confirm lock':'Confirm unlock'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
