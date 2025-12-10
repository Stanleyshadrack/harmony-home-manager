import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Home,
  Wrench,
  Calendar,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for charts
const revenueData = [
  { month: 'Jan', revenue: 125000, expenses: 45000 },
  { month: 'Feb', revenue: 132000, expenses: 48000 },
  { month: 'Mar', revenue: 128000, expenses: 52000 },
  { month: 'Apr', revenue: 145000, expenses: 47000 },
  { month: 'May', revenue: 152000, expenses: 55000 },
  { month: 'Jun', revenue: 148000, expenses: 51000 },
  { month: 'Jul', revenue: 158000, expenses: 49000 },
  { month: 'Aug', revenue: 162000, expenses: 53000 },
  { month: 'Sep', revenue: 155000, expenses: 50000 },
  { month: 'Oct', revenue: 168000, expenses: 56000 },
  { month: 'Nov', revenue: 175000, expenses: 58000 },
  { month: 'Dec', revenue: 180000, expenses: 60000 },
];

const occupancyData = [
  { month: 'Jan', rate: 85 },
  { month: 'Feb', rate: 87 },
  { month: 'Mar', rate: 88 },
  { month: 'Apr', rate: 90 },
  { month: 'May', rate: 92 },
  { month: 'Jun', rate: 91 },
  { month: 'Jul', rate: 93 },
  { month: 'Aug', rate: 94 },
  { month: 'Sep', rate: 93 },
  { month: 'Oct', rate: 95 },
  { month: 'Nov', rate: 94 },
  { month: 'Dec', rate: 96 },
];

const maintenanceByCategory = [
  { name: 'Plumbing', value: 35, color: '#3b82f6' },
  { name: 'Electrical', value: 25, color: '#f59e0b' },
  { name: 'HVAC', value: 18, color: '#10b981' },
  { name: 'Appliance', value: 12, color: '#8b5cf6' },
  { name: 'Structural', value: 10, color: '#ef4444' },
];

const maintenanceStatus = [
  { name: 'Pending', value: 12, color: '#f59e0b' },
  { name: 'In Progress', value: 8, color: '#3b82f6' },
  { name: 'Resolved', value: 45, color: '#10b981' },
  { name: 'Cancelled', value: 3, color: '#6b7280' },
];

const paymentCollection = [
  { month: 'Jan', collected: 118000, outstanding: 7000 },
  { month: 'Feb', collected: 125000, outstanding: 7000 },
  { month: 'Mar', collected: 120000, outstanding: 8000 },
  { month: 'Apr', collected: 140000, outstanding: 5000 },
  { month: 'May', collected: 145000, outstanding: 7000 },
  { month: 'Jun', collected: 142000, outstanding: 6000 },
];

const propertyPerformance = [
  { property: 'Sunrise Apartments', revenue: 450000, units: 24, occupancy: 92 },
  { property: 'Ocean View', revenue: 380000, units: 18, occupancy: 89 },
  { property: 'Garden Estate', revenue: 520000, units: 32, occupancy: 95 },
  { property: 'City Center', revenue: 280000, units: 12, occupancy: 100 },
];

export default function Reports() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('year');

  const stats = [
    {
      title: 'Total Revenue',
      value: 'KES 1,828,000',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Occupancy Rate',
      value: '94%',
      change: '+3.2%',
      trend: 'up',
      icon: Home,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Tenants',
      value: '156',
      change: '+8',
      trend: 'up',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Maintenance Resolved',
      value: '45',
      change: '-5.1%',
      trend: 'down',
      icon: Wrench,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <DashboardLayout
      title={t('reports.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('reports.title') },
      ]}
    >
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `${v/1000}k`} />
                      <Tooltip 
                        formatter={(value: number) => `KES ${value.toLocaleString()}`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="hsl(var(--muted-foreground))" name="Expenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={paymentCollection}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `${v/1000}k`} />
                      <Tooltip 
                        formatter={(value: number) => `KES ${value.toLocaleString()}`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="collected" stackId="1" stroke="#22c55e" fill="#22c55e33" name="Collected" />
                      <Area type="monotone" dataKey="outstanding" stackId="1" stroke="#ef4444" fill="#ef444433" name="Outstanding" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Occupancy Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" domain={[80, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip 
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} name="Occupancy Rate" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requests by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={maintenanceByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {maintenanceByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requests by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={maintenanceStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {maintenanceStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Property</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Units</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Occupancy</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Revenue (YTD)</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyPerformance.map((property) => (
                      <tr key={property.property} className="border-b last:border-0">
                        <td className="py-4 px-4 font-medium">{property.property}</td>
                        <td className="py-4 px-4 text-right">{property.units}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${property.occupancy >= 95 ? 'bg-green-500/10 text-green-500' : property.occupancy >= 85 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                            {property.occupancy}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">KES {property.revenue.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${property.occupancy}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
