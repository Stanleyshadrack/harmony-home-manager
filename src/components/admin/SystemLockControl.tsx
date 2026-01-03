import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Lock, Unlock, Shield, Clock, AlertTriangle } from 'lucide-react';
import {
  getSystemLockState,
  lockSystem,
  unlockSystem,
  updateAutoLockSettings,
  getLockLogs,
  SystemLockState,
  LockLogEntry,
} from '@/services/systemLockService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function SystemLockControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lockState, setLockState] = useState<SystemLockState | null>(null);
  const [lockLogs, setLockLogs] = useState<LockLogEntry[]>([]);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [autoLockHours, setAutoLockHours] = useState(24);

  useEffect(() => {
    const state = getSystemLockState();
    setLockState(state);
    setAutoLockEnabled(state.autoLockEnabled);
    setAutoLockHours(state.autoLockAfterHours);
    setLockLogs(getLockLogs());
  }, []);

  const handleLock = () => {
    if (!lockReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for locking the system.',
        variant: 'destructive',
      });
      return;
    }

    const newState = lockSystem(user?.email || 'Admin', lockReason);
    setLockState(newState);
    setLockLogs(getLockLogs());
    setShowLockDialog(false);
    setLockReason('');

    toast({
      title: 'System Locked',
      description: 'The system has been locked. Only super admins can access it.',
    });
  };

  const handleUnlock = () => {
    const newState = unlockSystem(user?.email || 'Admin');
    setLockState(newState);
    setLockLogs(getLockLogs());

    toast({
      title: 'System Unlocked',
      description: 'The system is now accessible to all users.',
    });
  };

  const handleAutoLockSettings = () => {
    const newState = updateAutoLockSettings(autoLockEnabled, autoLockHours, ['super_admin']);
    setLockState(newState);

    toast({
      title: 'Auto-Lock Settings Updated',
      description: autoLockEnabled
        ? `System will auto-lock after ${autoLockHours} hours of inactivity.`
        : 'Auto-lock has been disabled.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!lockState) return null;

  return (
    <div className="space-y-6">
      {/* Current Lock Status */}
      <Card className={lockState.isLocked ? 'border-destructive' : 'border-success'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {lockState.isLocked ? (
                <Lock className="h-6 w-6 text-destructive" />
              ) : (
                <Unlock className="h-6 w-6 text-success" />
              )}
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  {lockState.isLocked ? 'System is currently locked' : 'System is operational'}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={lockState.isLocked ? 'destructive' : 'default'}
              className={!lockState.isLocked ? 'bg-success text-success-foreground' : ''}
            >
              {lockState.isLocked ? 'LOCKED' : 'UNLOCKED'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lockState.isLocked && (
            <div className="p-4 bg-destructive/10 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Lock Details</span>
              </div>
              <p className="text-sm">
                <strong>Locked by:</strong> {lockState.lockedBy}
              </p>
              <p className="text-sm">
                <strong>Locked at:</strong> {formatDate(lockState.lockedAt!)}
              </p>
              <p className="text-sm">
                <strong>Reason:</strong> {lockState.reason}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {lockState.isLocked ? (
              <Button onClick={handleUnlock} className="bg-success hover:bg-success/90">
                <Unlock className="h-4 w-4 mr-2" />
                Unlock System
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setShowLockDialog(true)}>
                <Lock className="h-4 w-4 mr-2" />
                Lock System
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Lock Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Auto-Lock Settings
          </CardTitle>
          <CardDescription>
            Configure automatic system lockdown based on inactivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoLock">Enable Auto-Lock</Label>
              <p className="text-sm text-muted-foreground">
                Automatically lock the system after a period of inactivity
              </p>
            </div>
            <Switch
              id="autoLock"
              checked={autoLockEnabled}
              onCheckedChange={setAutoLockEnabled}
            />
          </div>

          {autoLockEnabled && (
            <div className="space-y-2">
              <Label htmlFor="autoLockHours">Lock after (hours)</Label>
              <Input
                id="autoLockHours"
                type="number"
                min={1}
                max={168}
                value={autoLockHours}
                onChange={(e) => setAutoLockHours(Number(e.target.value))}
              />
            </div>
          )}

          <Button onClick={handleAutoLockSettings}>Save Auto-Lock Settings</Button>
        </CardContent>
      </Card>

      {/* Lock History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Lock History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lockLogs.length > 0 ? (
            <div className="space-y-3">
              {lockLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {log.action === 'lock' ? (
                      <Lock className="h-4 w-4 text-destructive" />
                    ) : (
                      <Unlock className="h-4 w-4 text-success" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{log.action}</p>
                      <p className="text-sm text-muted-foreground">{log.performedBy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{log.details}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No lock history</p>
          )}
        </CardContent>
      </Card>

      {/* Lock Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock System</DialogTitle>
            <DialogDescription>
              Locking the system will prevent all non-admin users from accessing the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lockReason">Reason for Lock</Label>
              <Textarea
                id="lockReason"
                placeholder="e.g., Scheduled maintenance, Security incident..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLock}>
              <Lock className="h-4 w-4 mr-2" />
              Lock System
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
