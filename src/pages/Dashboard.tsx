import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/api/https';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickStatsWidget } from '@/components/dashboard/QuickStatsWidget';
import { 
  Building2, 
  Home, 
  Users, 
  DollarSign, 
  Wrench, 
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  type Summary = {
    collected: number; outstanding: number; unallocatedCredit: number; creditOffset: number; netOutstanding: number;
    units: number; occupiedUnits: number;
    maintenanceByStatus: Record<string, number>;
    properties: Array<{id: number}>;
  };
  type Activity = {
    id: number; action: string; entityType: string;
    entityId: number | null; details: string | null; createdAt: string;
  };
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [activityError, setActivityError] = useState('');
  const canViewFinancials = user?.role === 'super_admin' || user?.role === 'landlord';

  useEffect(() => {
    let active = true;
    if (!user) return;
    setActivityLoading(true);
    apiRequest<null, Activity[]>({path:'/api/audit-logs/recent', method:'GET'})
      .then(data => { if(active) {setActivities(data); setActivityError('');} })
      .catch(e => { if(active) setActivityError(e instanceof Error ? e.message : 'Could not load activities'); })
      .finally(() => { if(active) setActivityLoading(false); });
    if (user.role === 'super_admin' || user.role === 'landlord') {
      setSummaryLoading(true);
      apiRequest<null, Summary>({path:'/api/reports/summary?period=month', method:'GET'})
        .then(data => { if(active) {setSummary(data); setSummaryError('');} })
        .catch(e => { if(active) setSummaryError(e instanceof Error ? e.message : 'Could not load summary'); })
        .finally(() => { if(active) setSummaryLoading(false); });
    } else { setSummary(null); setSummaryLoading(false); }
    return () => {active=false;};
  }, [user?.id, user?.role]);

  const stats = canViewFinancials ? [
    {
      title: t('dashboard.totalProperties'),
      value: summaryLoading ? '…' : summary ? String(summary.properties.length) : '—',
      icon: Building2, color: 'text-primary', bgColor: 'bg-primary/10', href: '/properties',
    },
    {
      title: t('dashboard.totalUnits'),
      value: summaryLoading ? '…' : summary ? String(summary.units) : '—',
      icon: Home, color: 'text-success', bgColor: 'bg-success/10', href: '/units',
    },
    {
      title: 'Total Collected',
      value: summaryLoading ? '…' : summary ? `KES ${Number(summary.collected).toLocaleString('en-KE')}` : '—',
      icon: DollarSign, color: 'text-warning', bgColor: 'bg-warning/10', href: '/billing',
    },
    {
      title: 'Net Outstanding',
      value: summaryLoading ? '…' : summary ? `KES ${Number(summary.netOutstanding).toLocaleString('en-KE')}` : '—',
      icon: DollarSign, color: 'text-warning', bgColor: 'bg-warning/10', href: '/billing',
    },
    {
      title: t('dashboard.maintenanceRequests'),
      value: summaryLoading ? '…' : summary
        ? String(Object.entries(summary.maintenanceByStatus || {})
            .filter(([status]) => status.toUpperCase() !== 'RESOLVED')
            .reduce((total, [,count]) => total + count, 0)) : '—',
      icon: Wrench, color: 'text-destructive', bgColor: 'bg-destructive/10', href: '/maintenance',
    },
  ] : [];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: t('navigation.dashboard') }]}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t('dashboard.welcome', { name: user?.firstName || user?.email?.split('@')[0] })}
        </h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.overview')}</p>
      </div>

      {summaryError && <p role="alert" className="mb-4 text-sm text-destructive">{summaryError}</p>}
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.title === 'Total Collected' ? 'Current month · confirmed payments and advances' : stat.title === 'Net Outstanding' ? `Gross KES ${Number(summary?.outstanding ?? 0).toLocaleString('en-KE')} less eligible credit KES ${Number(summary?.creditOffset ?? 0).toLocaleString('en-KE')}` : 'Current month, from your accessible properties'}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats Widget - Pending Readings & Recent Messages */}
      <div className="mb-8">
        <QuickStatsWidget />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/recent-activities">View all <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <p role="status" className="text-sm text-muted-foreground">Loading activities…</p>
            ) : activityError ? (
              <p role="alert" className="text-sm text-destructive">{activityError}</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recorded activities yet.</p>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 5).map(activity => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-2"><CheckCircle className="h-4 w-4 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{activity.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground break-words">{activity.entityType}{activity.entityId != null ? ` #${activity.entityId}` : ''}{activity.details ? ` — ${activity.details}` : ''}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(activity.createdAt), {addSuffix:true})}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Link to="/properties">
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm">{t('properties.addProperty')}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Link to="/units">
                  <Home className="h-5 w-5" />
                  <span className="text-sm">{t('units.addUnit')}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Link to="/tenants">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">{t('tenants.addTenant')}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">{t('messages.newMessage')}</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </DashboardLayout>
  );
}
