import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  Droplets, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  AlertTriangle,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Cell
} from 'recharts';
import { useWaterData } from '@/hooks/useWaterData';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))'];

export default function WaterData() {
  const { t } = useTranslation();
  const { readings, getConsumptionStats, getHighConsumptionUnits } = useWaterData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  const stats = getConsumptionStats();
  const highConsumptionUnits = getHighConsumptionUnits();

  // Prepare chart data
  const monthlyChartData = Object.entries(stats.monthlyData).map(([month, data]) => ({
    month: month.split(' ')[0],
    consumption: data.consumption,
    revenue: data.revenue,
    count: data.count,
  }));

  const propertyConsumption = readings.reduce((acc, r) => {
    if (!acc[r.propertyName]) {
      acc[r.propertyName] = 0;
    }
    acc[r.propertyName] += r.consumption;
    return acc;
  }, {} as Record<string, number>);

  const propertyChartData = Object.entries(propertyConsumption).map(([name, value]) => ({
    name,
    value,
  }));

  const properties = [...new Set(readings.map(r => r.propertyName))];

  const filteredReadings = readings.filter(r => {
    const matchesSearch = 
      r.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProperty = propertyFilter === 'all' || r.propertyName === propertyFilter;
    return matchesSearch && matchesProperty;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardLayout
      title="Water Data & Analysis"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Water Data' },
      ]}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-info/10">
                <Droplets className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Consumption</p>
                <p className="text-2xl font-bold">{stats.totalConsumption.toLocaleString()} m³</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Water Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Consumption</p>
                <p className="text-2xl font-bold">{stats.avgConsumption.toFixed(1)} m³</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Usage Units</p>
                <p className="text-2xl font-bold">{highConsumptionUnits.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="readings">All Readings</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Consumption Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consumption Trend</CardTitle>
                  <CardDescription>Monthly water consumption in cubic meters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="consumption" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Month */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue by Month</CardTitle>
                  <CardDescription>Water billing revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Consumption by Property */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Consumption by Property</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] flex items-center justify-center gap-8">
                    <ResponsiveContainer width="50%" height="100%">
                      <PieChart>
                        <Pie
                          data={propertyChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name }) => name}
                        >
                          {propertyChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {propertyChartData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                          />
                          <span className="text-sm">{entry.name}</span>
                          <span className="text-sm font-medium">{entry.value} m³</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* All Readings Tab */}
          <TabsContent value="readings" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by unit or tenant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Meter ID</TableHead>
                    <TableHead className="text-right">Previous</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Consumption</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReadings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{format(new Date(reading.readingDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{reading.unitNumber}</TableCell>
                      <TableCell>{reading.tenantName}</TableCell>
                      <TableCell className="font-mono text-sm">{reading.meterId}</TableCell>
                      <TableCell className="text-right">{reading.previousReading}</TableCell>
                      <TableCell className="text-right">{reading.currentReading}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={reading.consumption > 60 ? 'destructive' : 'outline'}>
                          {reading.consumption} m³
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(reading.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Unit Comparison</CardTitle>
                  <CardDescription>Latest consumption by unit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={readings.slice(0, 6)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="unitNumber" type="category" className="text-xs" width={60} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                        <Bar dataKey="consumption" fill="hsl(var(--info))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consumption Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Average Consumption</p>
                    <p className="text-2xl font-bold">{stats.avgConsumption.toFixed(2)} m³</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Readings</p>
                    <p className="text-2xl font-bold">{stats.totalReadings}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Rate per Unit</p>
                    <p className="text-2xl font-bold">$1.50 / m³</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  High Consumption Alerts
                </CardTitle>
                <CardDescription>
                  Units consuming more than 60 m³ per reading period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {highConsumptionUnits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Droplets className="h-12 w-12 mb-4 opacity-50" />
                    <p>No high consumption alerts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {highConsumptionUnits.map((reading) => (
                      <div
                        key={reading.id}
                        className="flex items-center justify-between p-4 bg-warning/5 border border-warning/20 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-warning/10">
                            <TrendingUp className="h-5 w-5 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Unit {reading.unitNumber} - {reading.tenantName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {reading.propertyName} • {reading.billingPeriod}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">{reading.consumption} m³</Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatCurrency(reading.totalAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
