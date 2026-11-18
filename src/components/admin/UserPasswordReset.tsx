import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Key, Search, User, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/api/https';
import { useToast } from '@/hooks/use-toast';
import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';

type Account = {
  id: number; email: string; firstName: string | null; lastName: string | null;
  role: string; approved: boolean; active: boolean; emailVerified: boolean;
  createdAt: string | null;
};

export function UserPasswordReset() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Account | null>(null);
  const [view, setView] = useViewMode('admin-password-users', 'list');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<null, Account[]>({path: '/api/users', method: 'GET'});
      setUsers(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load user accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = users.filter(account => {
    const query = search.trim().toLowerCase();
    return [account.firstName ?? '', account.lastName ?? '', account.email, account.role]
      .join(' ').toLowerCase().includes(query);
  });
  const displayName = (account: Account) =>
    [account.firstName, account.lastName].filter(Boolean).join(' ') || account.email;
  const status = (account: Account) =>
    !account.active ? 'Inactive' : !account.approved ? 'Pending approval' : 'Active';

  async function requestReset() {
    if (!selected || sending) return;
    setSending(true);
    try {
      await apiRequest<{email:string}, unknown>({
        path:'/api/auth/password-reset/request', method:'POST',
        body:{ email:selected.email }
      });
      toast({
        title:'Password recovery requested',
        description:'If this account is eligible, a verification code will be sent directly to its registered email. The user must complete the reset themselves.',
      });
      setSelected(null);
    } catch(e) {
      toast({title:'Unable to request reset',
        description:e instanceof Error ? e.message : 'Try again later',
        variant:'destructive'});
    } finally { setSending(false); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5"/>User Password Management</CardTitle>
            <CardDescription>View actual registered accounts and initiate secure email-based password recovery.</CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4"/>Refresh users
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search by name, email, or role"
              value={search} onChange={event=>setSearch(event.target.value)}/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{visible.length} users</span>
            <ViewModeToggle value={view} onChange={setView}/>
          </div>
        </div>

        {loading && <p role="status" className="text-sm text-muted-foreground">Loading registered users…</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <div className="py-10 text-center">
            <User className="mx-auto mb-3 h-9 w-9 text-muted-foreground"/>
            <p className="font-medium">{search ? 'No matching users' : 'No user accounts found'}</p>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term.' : 'No accounts were returned by the backend.'}
            </p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && view === 'list' && (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  {['User','Email','Role','Status','Action'].map(heading=>
                    <th key={heading} scope="col" className="px-4 py-3 font-medium">{heading}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map(account=>(
                  <tr key={account.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{displayName(account)}</td>
                    <td className="px-4 py-3 break-all">{account.email}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{account.role}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={account.active ? 'secondary':'destructive'}>{status(account)}</Badge></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={()=>setSelected(account)}>
                        <Mail className="mr-2 h-4 w-4"/>Send recovery code
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && visible.length > 0 && view === 'grid' && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map(account=>(
              <div key={account.id} className="min-w-0 space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{displayName(account)}</p>
                    <p className="break-all text-xs text-muted-foreground">{account.email}</p>
                  </div>
                  <Badge variant="secondary">{account.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{status(account)}</p>
                <Button size="sm" variant="outline" className="w-full" onClick={()=>setSelected(account)}>
                  <Mail className="mr-2 h-4 w-4"/>Send recovery code
                </Button>
              </div>
            ))}
          </div>
        )}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0"/>
          Passwords and reset codes are not displayed or stored in the browser.
          Recovery is completed by the account owner using the existing verified email flow.
        </p>
      </CardContent>

      <Dialog open={!!selected} onOpenChange={open=>{if(!open&&!sending)setSelected(null);}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send password recovery code?</DialogTitle>
            <DialogDescription>
              Send a password reset verification code to {selected?.email}.
              The user will verify the code and choose their own new password.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={sending} onClick={()=>setSelected(null)}>Cancel</Button>
            <Button disabled={sending} onClick={()=>void requestReset()}>
              {sending?'Requesting…':'Send recovery code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
