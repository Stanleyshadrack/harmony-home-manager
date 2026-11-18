import { useNavigate } from 'react-router-dom';
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { readLockInfo, discardLockInfo } from '@/services/sessionLock';
import { useAuth } from '@/contexts/AuthContext';

export default function Locked() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const info = readLockInfo();
  return <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="items-center space-y-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <LockKeyhole className="h-8 w-8 text-primary"/>
        </div>
        <CardTitle className="text-2xl">System locked</CardTitle>
        <CardDescription>
          {info?.reason === 'idle'
            ? 'Your session was locked after 15 minutes of inactivity.'
            : 'Your session has been secured. Sign in again to continue.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {info?.email && <p className="break-all text-center text-sm text-muted-foreground">
          Account: <span className="font-medium text-foreground">{info.email}</span>
        </p>}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4"/> Authentication is required before protected data can be accessed.
        </div>
        <Button className="w-full" onClick={() => navigate('/auth', { replace: true })}>
          <LogIn className="mr-2 h-4 w-4"/> Sign in to unlock
        </Button>
        <Button className="w-full" variant="outline" onClick={() => {
          discardLockInfo(); logout(); navigate('/auth', {replace:true});
        }}>
          Use a different account
        </Button>
      </CardContent>
    </Card>
  </div>;
}
