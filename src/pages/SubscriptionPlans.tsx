import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, CalendarClock, ShieldCheck, CheckCircle, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/api/https';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_PLANS } from '@/components/Plans';

type CompanySubscription = {
  companyId: number;
  companyName: string;
  plan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'SUSPENDED';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  billingCycle?: 'MONTHLY' | 'ANNUAL';
  maxProperties: number;
  maxUnits: number;
  currentProperties: number;
  currentUnits: number;
};

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true);
    try {
      const response = await apiRequest<null, CompanySubscription>({
        path: '/api/subscriptions/me', method: 'GET',
      });
      setSubscription(response);
      setError('');
    } catch (e) {
      setSubscription(null);
      setError(e instanceof Error ? e.message : 'Unable to load company subscription');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user?.role === 'landlord') void load();
    else setLoading(false);
  }, [user?.id, user?.role]);
  if (user?.role !== 'landlord') {
    return <DashboardLayout title="Company Subscriptions">
      <Card><CardContent className="p-6 text-muted-foreground">
        Subscriptions are owned by companies. Company self-service is available to the associated landlord.
        Administrators should manage subscriptions by company ID through the administrator workflow.
      </CardContent></Card>
    </DashboardLayout>;
  }
  return (
    <DashboardLayout title="Subscription Plans"
      breadcrumbs={[{label:'Dashboard',href:'/dashboard'},{label:'Subscription Plans'}]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Company subscription</h2>
            <p className="text-sm text-muted-foreground">One subscription per company, shared by its properties and units.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading} className="gap-2">
            <RefreshCw className="h-4 w-4"/> Refresh
          </Button>
        </div>
        {loading && <p role="status">Loading subscription from PostgreSQL…</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!loading && subscription && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5"/>{subscription.companyName}
              </CardTitle>
              <CardDescription>Company ID: {subscription.companyId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{subscription.plan}</Badge>
                <Badge variant={subscription.status === 'ACTIVE' ? 'secondary' : 'destructive'}>{subscription.status}</Badge>
                <span className="text-sm text-muted-foreground">
                  <CalendarClock className="mr-1 inline h-4 w-4"/>
                  {subscription.startDate} — {subscription.endDate}
                </span>
                <span className="text-sm text-muted-foreground">{subscription.daysRemaining} days remaining</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">Properties used</p>
                  <p className="text-2xl font-semibold">{subscription.currentProperties ?? 0} / {subscription.maxProperties}</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">Units used</p>
                  <p className="text-2xl font-semibold">{subscription.currentUnits ?? 0} / {subscription.maxUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <div>
          <h3 className="mb-2 text-lg font-semibold">Available plans</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Plan pricing and feature descriptions are indicative until the subscription payment and catalog
            are verified with the backend. No card details are collected or charged on this page.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {SUBSCRIPTION_PLANS.map(plan => (
              <Card key={plan.id} className={subscription?.plan === plan.id ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.features.join(' · ')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subscription?.plan === plan.id
                    ? <div className="flex items-center gap-2 text-sm text-primary"><CheckCircle className="h-4 w-4"/> Current company plan</div>
                    : <div className="text-sm text-muted-foreground">Upgrade pending payment-provider integration</div>}
                  <Button className="w-full" variant="outline" disabled>
                    <ShieldCheck className="mr-2 h-4 w-4"/>
                    {subscription?.plan === plan.id ? 'Current plan' : 'Payment integration required'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          A paid subscription must only activate after the server verifies a matching payment, amount,
          reference, and company. Renewal and upgrade actions are disabled until that workflow is available.
        </p>
      </div>
    </DashboardLayout>
  );
}
