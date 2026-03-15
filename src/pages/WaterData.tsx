import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Droplets,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Check,
  X,
  Clock,
  Plus,
  User
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { WaterReadingResponse as WaterReading } from '@/api/dto/water.readings.dto';
import { Label } from '@/components/ui/label';
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

import { useAuth } from '@/contexts/AuthContext';
import { WaterReadingForm } from '@/components/billing/WaterReadingForm';
import { useToast } from '@/hooks/use-toast';
import { useWaterData } from '@/hooks/useWaterData';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))'];

export default function WaterData() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    readings,
    stats,
    monthlyStats,
    highUsage,
    isLoading,

    canAddReading,
    canApprove,

    addReading,
    approveReading,
    rejectReading,
    deleteReading,

    getPendingReadings,
    getApprovedReadings,

    reload
  } = useWaterData();


  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedReading, setSelectedReading] = useState<WaterReading | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingReadings = getPendingReadings();

  const highConsumptionUnits = highUsage;

  // Prepare chart data
  const monthlyChartData = monthlyStats.map((m) => ({
    month: m.month,
    consumption: m.consumption,
    revenue: m.revenue,
    count: m.count,
  }));



  const propertyConsumption = readings.reduce((acc, r) => {
    if (!acc[r.property]) acc[r.property] = 0;
    acc[r.property] += r.consumption;
    return acc;
  }, {} as Record<string, number>);


  const propertyChartData = Object.entries(propertyConsumption).map(([name, value]) => ({
    name,
    value,
  }));

  const properties = Array.from(new Set(readings.map(r => r.property)));

  const filteredReadings = readings.filter((r) => {
    const unit = r.unitNumber?.toLowerCase() || "";
    const tenant = r.tenantName?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      unit.includes(query) ||
      tenant.includes(query);

    const matchesProperty =
      propertyFilter === "all" || r.property === propertyFilter;

    const matchesStatus =
      statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesProperty && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleApprove = async (reading: WaterReading) => {
    try {
      const success = await approveReading(Number(reading.id));

      if (!success) return;

      toast({
        title: 'Reading Approved',
        description: `Water reading for ${reading.unitNumber} has been approved.`,
      });

    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Could not approve water reading.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedReading || !rejectionReason.trim()) return;

    const success = await rejectReading(Number(selectedReading.id));

    if (success) {
      toast({
        title: "Reading Rejected",
        description: `Water reading for ${selectedReading.unitNumber} has been rejected.`,
        variant: "destructive",
      });
    }

    setShowRejectDialog(false);
    setSelectedReading(null);
    setRejectionReason("");
  };

  const openRejectDialog = (reading: WaterReading) => {
    setSelectedReading(reading);
    setShowRejectDialog(true);
  };

  const handleAddReading = async (data: any) => {

    const result = await addReading({
      unitId: data.unitId,
      meterId: data.meterId,
      currentReading: data.currentReading,
      ratePerUnit: data.ratePerUnit,
      readingDate: data.readingDate,
      billingPeriod: data.billingPeriod,
    });

    if (result) {
      toast({
        title: "Water Reading Added",
        description: `Reading for unit ${result.unitNumber} recorded successfully`,
      });

      setShowAddDialog(false);
      reload();
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-success/10 text-success border-success/20"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline" className="border-warning/50 text-warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
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
        {/* Header Actions */}
        {canAddReading && (
          <div className="flex justify-end">
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Water Reading
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-info/10">
                <Droplets className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Consumption</p>
                <p className="text-2xl font-bold">
                  {(stats?.totalConsumption ?? 0).toLocaleString()} m³
                </p>
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
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
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
                <p className="text-2xl font-bold">
                  {(stats?.avgConsumption ?? 0).toFixed(1)} m³
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{stats?.pendingCount ?? 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Usage Units</p>
                <p className="text-2xl font-bold">{highUsage.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="readings">All Readings</TabsTrigger>
            {canApprove && (
              <TabsTrigger value="pending" className="relative">
                Pending Approval
                {pendingReadings.length > 0 && (
                  <Badge className="ml-2 bg-warning text-warning-foreground">{pendingReadings.length}</Badge>
                )}
              </TabsTrigger>
            )}
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
                          {propertyChartData.map((_, index) => (
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
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
                    <TableHead>Recorded By</TableHead>
                    <TableHead className="text-right">Consumption</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    {canApprove && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReadings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{format(new Date(reading.readingDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{reading.unitNumber}</TableCell>
                      <TableCell>{reading.tenantName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{reading.recordedBy}</span>
                          <Badge variant="outline" className="text-xs">
                            {reading.recordedByRole}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={reading.consumption > 60 ? 'destructive' : 'outline'}>
                          {reading.consumption} m³
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(reading.amount))}
                      </TableCell>
                      <TableCell>{getStatusBadge(reading.status)}</TableCell>
                      {canApprove && (
                        <TableCell>
                          <div className="flex gap-2">

                            {reading.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-success"
                                  onClick={() => handleApprove(reading)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => openRejectDialog(reading)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() => deleteReading(reading.id)}
                            >
                              Delete
                            </Button>

                          </div>
                        </TableCell>
                      )}

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Pending Approval Tab */}
          {canApprove && (
            <TabsContent value="pending" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    Pending Water Readings
                  </CardTitle>
                  <CardDescription>
                    Review and approve water readings submitted by employees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingReadings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Check className="h-12 w-12 mb-4 opacity-50" />
                      <p>All readings have been reviewed</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingReadings.map((reading) => (
                        <div
                          key={reading.id}
                          className="flex items-center justify-between p-4 bg-warning/5 border border-warning/20 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium">
                                  Unit {reading.unitNumber} - {reading.tenantName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {reading.property} • {reading.billingPeriod}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Recorded by: {reading.recordedBy} ({reading.recordedByRole})
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">{reading.consumption} m³</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(Number(reading.amount))}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => handleApprove(reading)}>
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => openRejectDialog(reading)}>
                                <X className="h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

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
                      <BarChart data={readings.filter(r => r.status === 'APPROVED').slice(0, 6)} layout="vertical">
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
                    <p className="text-2xl font-bold">{(stats?.avgConsumption ?? 0).toFixed(2)} m³ m³</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Approved Readings</p>
                    <p className="text-2xl font-bold">{stats?.totalReadings ?? 0}</p>
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
                {highUsage.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Droplets className="h-12 w-12 mb-4 opacity-50" />
                    <p>No high consumption alerts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {highConsumptionUnits.map((reading) => (
                      <div
                        key={reading.unitId}
                        className="flex items-center justify-between p-4 bg-warning/5 border border-warning/20 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-warning/10">
                            <TrendingUp className="h-5 w-5 text-warning" />
                          </div>

                          <div>
                            <p className="font-medium">
                              Unit {reading.unitId}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {reading.property} • {reading.billingPeriod}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge variant="destructive">
                            {reading.consumption} m³
                          </Badge>
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

      {/* Add Water Reading Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Water Reading</DialogTitle>
            <DialogDescription>
              {user?.role === 'landlord'
                ? 'Record a water meter reading. It will be auto-approved.'
                : 'Submit a water meter reading for landlord approval.'}
            </DialogDescription>
          </DialogHeader>
          <WaterReadingForm
            onSubmit={handleAddReading}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Water Reading</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this water reading.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Reject Reading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
