import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickStatsWidget } from '@/components/dashboard/QuickStatsWidget';
import { useProperties, useUnits } from '@/hooks/useProperties';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useMyInvoices } from '@/hooks/useBilling';
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

  // Fetch real data from your backend infrastructure
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { units, isLoading: unitsLoading } = useUnits();
  const { requests: maintenanceRequests, isLoading: maintenanceLoading } = useMaintenance();
  const { data: invoices = [], isLoading: invoicesLoading } = useMyInvoices();

  /* ======================================================
     📊 REAL-TIME METRICS CALCULATIONS
  ====================================================== */
  
  // 1. Occupancy Rate Calculation
  const totalUnitsCount = units.length;
  const occupiedUnitsCount = units.filter(u => u.status === 'occupied').length;
  const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0;

  // 2. Rent Collected Calculation (Summing up paid invoices)
  const totalRentCollected = invoices
    .filter((inv: any) => inv.status?.toLowerCase() === 'paid')
    .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

  // Currency Formatter Utility (e.g., 2400000 -> KES 2.40M or KES 2,400,000)
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `KES ${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `KES ${(value / 1_000).toFixed(1)}K`;
    }
    return `KES ${value.toLocaleString()}`;
  };

  // 3. Maintenance Breakdown
  const pendingOrUrgentMaintenance = maintenanceRequests.filter(
    req => req.status === 'pending' || req.priority === 'high' || req.priority === 'urgent'
  ).length;

  const stats = [
    {
      title: t('dashboard.totalProperties'),
      value: propertiesLoading ? '...' : String(properties.length),
      icon: Building2,
      trend: t('dashboard.activeProperties', { defaultValue: 'Managed estates' }),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      href: '/properties',
    },
    {
      title: t('dashboard.totalUnits'),
      value: unitsLoading ? '...' : String(totalUnitsCount),
      icon: Home,
      trend: `${occupancyRate}% occupied`,
      color: 'text-success',
      bgColor: 'bg-success/10',
      href: '/units',
    },
    {
      title: t('dashboard.rentCollected'),
      value: invoicesLoading ? '...' : formatCurrency(totalRentCollected),
      icon: DollarSign,
      trend: t('dashboard.grossCollection', { defaultValue: 'Total paid invoices' }),
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      href: '/billing',
    },
    {
      title: t('dashboard.maintenanceRequests'),
      value: maintenanceLoading ? '...' : String(maintenanceRequests.length),
      icon: Wrench,
      trend: `${pendingOrUrgentMaintenance} attention needed`,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      href: '/maintenance',
    },
  ];

  /* ======================================================
     🔄 DYNAMIC RECENT ACTIVITY BUILDER
  ====================================================== */
  const dynamicActivities = [
    ...maintenanceRequests.slice(0, 2).map((req) => ({
      type: 'maintenance',
      message: `${req.title} (${req.propertyName} - Unit ${req.ticketNumber})`,
      time: req.status === 'pending' ? 'New Request' : req.status.replace('_', ' '),
      icon: AlertCircle,
    })),
    ...invoices.slice(0, 2).map((inv: any) => ({
      type: 'payment',
      message: `Invoice ${inv.invoiceNumber || ''} status updated to ${inv.status}`,
      time: inv.dueDate ? `Due: ${new Date(inv.dueDate).toLocaleDateString()}` : 'Recent',
      icon: CheckCircle,
    })),
  ].slice(0, 4); // Keep top 4 combined entries

  // Fallback if backend has zero records yet
  const recentActivity = dynamicActivities.length > 0 ? dynamicActivities : [
    { type: 'empty', message: 'No recent structural activities found.', time: 'System clear', icon: CheckCircle }
  ];

  const globalLoading = propertiesLoading || unitsLoading || maintenanceLoading || invoicesLoading;

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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend}
                </p>
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
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <Link to="/maintenance">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'payment' ? 'bg-success/10 text-success' :
                    activity.type === 'maintenance' ? 'bg-warning/10 text-warning' :
                    activity.type === 'tenant' ? 'bg-info/10 text-info' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground capitalize">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
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