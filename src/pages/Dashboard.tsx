import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const stats = [
    {
      title: t('dashboard.totalProperties'),
      value: '12',
      icon: Building2,
      trend: '+2 this month',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      href: '/properties',
    },
    {
      title: t('dashboard.totalUnits'),
      value: '156',
      icon: Home,
      trend: '94% occupied',
      color: 'text-success',
      bgColor: 'bg-success/10',
      href: '/units',
    },
    {
      title: t('dashboard.rentCollected'),
      value: 'KES 2.4M',
      icon: DollarSign,
      trend: '+15% from last month',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      href: '/billing',
    },
    {
      title: t('dashboard.maintenanceRequests'),
      value: '8',
      icon: Wrench,
      trend: '3 urgent',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      href: '/maintenance',
    },
  ];

  const recentActivity = [
    { type: 'payment', message: 'John Doe paid rent for Unit 12A', time: '2 hours ago', icon: CheckCircle },
    { type: 'maintenance', message: 'New maintenance request: Leaky faucet in Unit 5B', time: '4 hours ago', icon: AlertCircle },
    { type: 'tenant', message: 'New tenant application for Unit 3C', time: '1 day ago', icon: Users },
    { type: 'message', message: 'Message from tenant in Unit 8A', time: '2 days ago', icon: MessageSquare },
  ];

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
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
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
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

      {/* Supabase Setup Notice */}
      <Card className="mt-6 border-warning/50 bg-warning/5">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="p-2 rounded-full bg-warning/10">
            <AlertCircle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-warning">Backend Not Connected</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This is a demo with mock data. To enable real authentication, database, and all features,
              please enable Lovable Cloud from the Cloud tab in the left panel.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
