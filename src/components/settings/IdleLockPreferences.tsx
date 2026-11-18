import { useEffect, useState } from 'react';
import { Clock3, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getIdleLockMinutes, IDLE_LOCK_OPTIONS, IdleLockMinutes, lockSession, setIdleLockMinutes } from '@/services/sessionLock';

export function IdleLockPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [minutes, setMinutes] = useState<IdleLockMinutes>(30);
  useEffect(() => {
    if (user?.id) setMinutes(getIdleLockMinutes(user.id));
  }, [user?.id]);

  const selectMinutes = (value: string) => {
    if (!user?.id) return;
    const selected = Number(value);
    if (!IDLE_LOCK_OPTIONS.some(option => option === selected)) return;
    const next = selected as IdleLockMinutes;
    try {
      setIdleLockMinutes(user.id, next);
      setMinutes(next);
      toast({ title: 'Auto-lock preference saved', description: `Your screen will lock after ${next} minute${next === 1 ? '' : 's'} of inactivity.` });
    } catch {
      toast({ title: 'Could not save auto-lock preference', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5"/>Automatic screen lock</CardTitle>
        <CardDescription>
          Choose when your personal session locks after inactivity. An animated 5-second warning lets you select Keep Alive before the screen locks. This does not affect Super Admin maintenance locks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <Label>Lock after inactivity</Label>
          <RadioGroup value={String(minutes)} onValueChange={selectMinutes} className="grid gap-2 sm:grid-cols-3">
            {IDLE_LOCK_OPTIONS.map(value => (
              <label key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/60 ${minutes === value ? 'border-primary bg-primary/5' : ''}`}>
                <RadioGroupItem value={String(value)} id={`idle-lock-${value}`}/>
                <span className="font-medium">{value} {value === 1 ? 'minute' : 'minutes'}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <LockKeyhole className="h-4 w-4"/> Lock instantly
            </p>
            <p className="text-xs text-muted-foreground">Lock this session now without waiting for the inactivity timer.</p>
          </div>
          <Button variant="outline" onClick={() => lockSession('manual')}>
            <LockKeyhole className="mr-2 h-4 w-4"/> Lock now
          </Button>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0"/>
          Your choice is saved for this account in this browser. Unlocking requires the normal sign-in and OTP process when applicable.
        </p>
      </CardContent>
    </Card>
  );
}
