import { useEffect, useState } from 'react';
import { LockKeyhole, LockKeyholeOpen, ShieldAlert, Wrench, RefreshCw } from 'lucide-react';
import { useSystemMaintenance, announceMaintenanceChange } from '@/hooks/useSystemMaintenance';
import { apiRequest } from '@/api/https';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function MaintenanceControl() {
  const {status, loading, error, refresh} = useSystemMaintenance();
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {setMessage(status.message);}, [status.message]);

  async function save(enabled: boolean) {
    if (saving) return;
    setSaving(true);
    try {
      await apiRequest<{enabled:boolean; message:string}, unknown>({
        path:'/api/system-maintenance', method:'PUT',
        body:{enabled, message:message.trim()}
      });
      setConfirm(null);
      await refresh();
      announceMaintenanceChange();
      toast.success(enabled ? 'System locked for maintenance' : 'System access restored');
    } catch(e) {
      toast.error(e instanceof Error ? e.message : 'Unable to update system maintenance');
    } finally {setSaving(false);}
  }

  return <Card className={status.enabled ? 'border-amber-500/60' : ''}>
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5"/>System Maintenance Lock</CardTitle>
        <Badge variant={status.enabled ? 'destructive':'secondary'}>
          {status.enabled ? 'Locked — maintenance active' : 'Online — access open'}
        </Badge>
      </div>
      <CardDescription>
        Super Admin only. Restricts all other users at both the application screen and backend API.
        You retain administrator access for maintenance work.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="system-maintenance-message">Message shown to affected users</Label>
        <Textarea id="system-maintenance-message" rows={4} maxLength={1000}
          disabled={loading || saving} value={message} onChange={e=>setMessage(e.target.value)}
          placeholder="We are carrying out scheduled maintenance. Please check back shortly." />
        <p className="text-xs text-muted-foreground">{message.length}/1000 characters</p>
      </div>
      {status.enabled && <p className="text-sm text-amber-600 dark:text-amber-400">
        <ShieldAlert className="mr-2 inline h-4 w-4"/> Changes will be blocked for landlords, employees and tenants until you restore access.
      </p>}
      <div className="flex flex-wrap gap-2">
        <Button disabled={loading || saving || !message.trim() || message.length>1000}
          variant={status.enabled ? 'outline' : 'destructive'}
          onClick={()=>setConfirm(!status.enabled)}>
          {status.enabled ? <LockKeyholeOpen className="mr-2 h-4 w-4"/> : <LockKeyhole className="mr-2 h-4 w-4"/>}
          {status.enabled ? 'Unlock entire system' : 'Lock entire system'}
        </Button>
        <Button variant="outline" disabled={loading || saving} onClick={()=>void refresh()}>
          <RefreshCw className="mr-2 h-4 w-4"/>Refresh status
        </Button>
      </div>
    </CardContent>
    <AlertDialog open={confirm !== null} onOpenChange={open=>{if(!open && !saving)setConfirm(null);}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm ? 'Lock the entire system?' : 'Restore system access?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirm
              ? 'Landlords, employees and tenants will be blocked from application APIs and see your maintenance notice. Active users will see the notice within approximately 10 seconds.'
              : 'All authorized users will regain application access. Confirm maintenance has been completed before proceeding.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <Button disabled={saving} variant={confirm ? 'destructive':'default'}
            onClick={()=>{if(confirm !== null) void save(confirm);}}>
            {saving ? 'Applying…' : confirm ? 'Confirm system lock' : 'Confirm unlock'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Card>;
}
