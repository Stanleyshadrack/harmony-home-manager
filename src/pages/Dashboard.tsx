import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Home, 
  Users, 
  DollarSign, 
  Wrench, 
  MessageSquare,
  LogOut,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleLogout = async () => {
    await logout();
    toast.success(t('auth.logoutSuccess'));
  };

  const stats = [
    {
      title: t('dashboard.totalProperties'),
      value: '12',
      icon: Building2,
      trend: '+2 this month',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('dashboard.totalUnits'),
      value: '156',
      icon: Home,
      trend: '94% occupied',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: t('dashboard.rentCollected'),
      value: 'KES 2.4M',
      icon: DollarSign,
      trend: '+15% from last month',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: t('dashboard.maintenanceRequests'),
      value: '8',
      icon: Wrench,
      trend: '3 urgent',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  const recentActivity = [
    { type: 'payment', message: 'John Doe paid rent for Unit 12A', time: '2 hours ago', icon: CheckCircle },
    { type: 'maintenance', message: 'New maintenance request: Leaky faucet in Unit 5B', time: '4 hours ago', icon: AlertCircle },
    { type: 'tenant', message: 'New tenant application for Unit 3C', time: '1 day ago', icon: Users },
    { type: 'message', message: 'Message from tenant in Unit 8A', time: '2 days ago', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">{t('common.appName')}</span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{user?.email}</span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                {t(`roles.${user?.role}`)}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
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
            <Card key={stat.title} className="relative overflow-hidden">
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
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
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
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <Home className="h-5 w-5" />
                  <span className="text-sm">{t('properties.addProperty')}</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">{t('tenants.addTenant')}</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm">{t('billing.createInvoice')}</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">{t('messages.newMessage')}</span>
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
      </main>
    </div>
  );
}
