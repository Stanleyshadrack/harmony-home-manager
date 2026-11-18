import { useLocation, useNavigate } from 'react-router-dom';
import { Wrench, ShieldAlert, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSystemMaintenance } from '@/hooks/useSystemMaintenance';
import { useAuth } from '@/contexts/AuthContext';

export function SystemMaintenanceGate({children}:{children: React.ReactNode}) {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { status, loading, error, refresh } = useSystemMaintenance();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'super_admin';
  const adminLogin = location.pathname === '/auth' &&
    new URLSearchParams(location.search).get('maintenance-admin') === '1';
  if (isAdmin) return <>{children}</>;
  // Fail closed for authenticated non-admin screens until status has been verified.
  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center">
    <span role="status" className="text-sm text-muted-foreground">Checking system availability…</span>
  </div>;
  if (error && !status.enabled) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
    <ShieldAlert className="h-9 w-9 text-destructive" />
    <p className="font-semibold">Unable to verify system availability</p>
    <p className="text-sm text-muted-foreground">{error}</p>
    <Button variant="outline" onClick={() => void refresh()}><RefreshCw className="h-4 w-4"/> Retry</Button>
  </div>;
  if (!status.enabled || adminLogin) return <>{children}</>;

  return <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader className="items-center space-y-3 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Wrench className="h-10 w-10 text-primary"/>
        </div>
        <CardTitle className="text-2xl">System under maintenance</CardTitle>
        <CardDescription>Access has temporarily been restricted by the system administrator.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-center">
        <p className="whitespace-pre-wrap break-words rounded-md border bg-background p-4 text-sm">
          {status.message}
        </p>
        {status.enabledAt && <p className="text-xs text-muted-foreground">
          Maintenance started: {new Date(status.enabledAt).toLocaleString()}
        </p>}
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => void refresh()}>
            <RefreshCw className="mr-2 h-4 w-4"/> Check availability
          </Button>
          <Button variant="ghost" onClick={() => {
            logout();
            navigate('/auth?maintenance-admin=1', {replace:true});
          }}>
            <ShieldCheck className="mr-2 h-4 w-4"/> Administrator sign in
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The page automatically checks for restoration every 10 seconds.
          Please avoid submitting transactions until maintenance is complete.
        </p>
      </CardContent>
    </Card>
  </div>;
}
