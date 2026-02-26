import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Gauge,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  Home,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface WaterMeter {
  id: string;
  meterId: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  installationDate: Date;
  lastReadingDate: Date | null;
  lastReading: number;
  status: 'active' | 'inactive' | 'maintenance';
  meterType: 'analog' | 'digital' | 'smart';
  manufacturer: string;
  model: string;
  serialNumber: string;
  notes: string;
}

// Mock data for water meters
const mockMeters: WaterMeter[] = [
  {
    id: '1',
    meterId: 'WM-001',
    propertyId: '1',
    propertyName: 'Sunset Apartments',
    unitId: '101',
    unitNumber: 'A101',
    installationDate: new Date('2023-01-15'),
    lastReadingDate: new Date('2024-01-20'),
    lastReading: 1245.5,
    status: 'active',
    meterType: 'digital',
    manufacturer: 'Sensus',
    model: 'iPERL',
    serialNumber: 'SN-2023-001',
    notes: 'Regular maintenance scheduled',
  },
  {
    id: '2',
    meterId: 'WM-002',
    propertyId: '1',
    propertyName: 'Sunset Apartments',
    unitId: '102',
    unitNumber: 'A102',
    installationDate: new Date('2023-01-15'),
    lastReadingDate: new Date('2024-01-18'),
    lastReading: 987.2,
    status: 'active',
    meterType: 'smart',
    manufacturer: 'Kamstrup',
    model: 'flowIQ 2200',
    serialNumber: 'SN-2023-002',
    notes: '',
  },
  {
    id: '3',
    meterId: 'WM-003',
    propertyId: '2',
    propertyName: 'Ocean View Complex',
    unitId: '201',
    unitNumber: 'B201',
    installationDate: new Date('2022-06-10'),
    lastReadingDate: new Date('2024-01-15'),
    lastReading: 2156.8,
    status: 'maintenance',
    meterType: 'analog',
    manufacturer: 'Neptune',
    model: 'T-10',
    serialNumber: 'SN-2022-015',
    notes: 'Needs calibration check',
  },
  {
    id: '4',
    meterId: 'WM-004',
    propertyId: '2',
    propertyName: 'Ocean View Complex',
    unitId: '202',
    unitNumber: 'B202',
    installationDate: new Date('2022-06-10'),
    lastReadingDate: null,
    lastReading: 0,
    status: 'inactive',
    meterType: 'digital',
    manufacturer: 'Badger Meter',
    model: 'E-Series',
    serialNumber: 'SN-2022-016',
    notes: 'Unit currently vacant',
  },
  {
    id: '5',
    meterId: 'WM-005',
    propertyId: '3',
    propertyName: 'Green Valley Residences',
    unitId: '301',
    unitNumber: 'C301',
    installationDate: new Date('2023-08-20'),
    lastReadingDate: new Date('2024-01-22'),
    lastReading: 456.3,
    status: 'active',
    meterType: 'smart',
    manufacturer: 'Itron',
    model: 'Cyble',
    serialNumber: 'SN-2023-045',
    notes: 'Remote reading enabled',
  },
];

export default function WaterMeters() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [meters, setMeters] = useState<WaterMeter[]>(mockMeters);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<WaterMeter | null>(null);
  const [formData, setFormData] = useState({
    meterId: '',
    propertyName: '',
    unitNumber: '',
    meterType: 'digital' as WaterMeter['meterType'],
    manufacturer: '',
    model: '',
    serialNumber: '',
    notes: '',
  });

  const properties = useMemo(() => {
    return Array.from(new Set(meters.map((m) => m.propertyName)));
  }, [meters]);

  const filteredMeters = useMemo(() => {
    return meters.filter((m) => {
      const matchesSearch =
        m.meterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProperty = propertyFilter === 'all' || m.propertyName === propertyFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesType = typeFilter === 'all' || m.meterType === typeFilter;
      return matchesSearch && matchesProperty && matchesStatus && matchesType;
    });
  }, [meters, searchQuery, propertyFilter, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: meters.length,
      active: meters.filter((m) => m.status === 'active').length,
      inactive: meters.filter((m) => m.status === 'inactive').length,
      maintenance: meters.filter((m) => m.status === 'maintenance').length,
    };
  }, [meters]);

  const getStatusBadge = (status: WaterMeter['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Maintenance
          </Badge>
        );
    }
  };

  const getMeterTypeBadge = (type: WaterMeter['meterType']) => {
    switch (type) {
      case 'smart':
        return <Badge variant="outline" className="border-primary/50 text-primary">Smart</Badge>;
      case 'digital':
        return <Badge variant="outline">Digital</Badge>;
      case 'analog':
        return <Badge variant="outline" className="border-muted-foreground/50">Analog</Badge>;
    }
  };

  const resetForm = () => {
    setFormData({
      meterId: '',
      propertyName: '',
      unitNumber: '',
      meterType: 'digital',
      manufacturer: '',
      model: '',
      serialNumber: '',
      notes: '',
    });
  };

  const handleAddMeter = () => {
    const newMeter: WaterMeter = {
      id: Date.now().toString(),
      meterId: formData.meterId,
      propertyId: '1',
      propertyName: formData.propertyName,
      unitId: '1',
      unitNumber: formData.unitNumber,
      installationDate: new Date(),
      lastReadingDate: null,
      lastReading: 0,
      status: 'active',
      meterType: formData.meterType,
      manufacturer: formData.manufacturer,
      model: formData.model,
      serialNumber: formData.serialNumber,
      notes: formData.notes,
    };
    setMeters([...meters, newMeter]);
    setShowAddDialog(false);
    resetForm();
    toast({
      title: 'Meter Added',
      description: `Water meter ${formData.meterId} has been added successfully.`,
    });
  };

  const handleEditMeter = () => {
    if (!selectedMeter) return;
    setMeters(
      meters.map((m) =>
        m.id === selectedMeter.id
          ? {
              ...m,
              meterId: formData.meterId,
              propertyName: formData.propertyName,
              unitNumber: formData.unitNumber,
              meterType: formData.meterType,
              manufacturer: formData.manufacturer,
              model: formData.model,
              serialNumber: formData.serialNumber,
              notes: formData.notes,
            }
          : m
      )
    );
    setShowEditDialog(false);
    setSelectedMeter(null);
    resetForm();
    toast({
      title: 'Meter Updated',
      description: 'Water meter has been updated successfully.',
    });
  };

  const handleDeleteMeter = () => {
    if (!selectedMeter) return;
    setMeters(meters.filter((m) => m.id !== selectedMeter.id));
    setShowDeleteDialog(false);
    setSelectedMeter(null);
    toast({
      title: 'Meter Deleted',
      description: 'Water meter has been removed.',
      variant: 'destructive',
    });
  };

  const openEditDialog = (meter: WaterMeter) => {
    setSelectedMeter(meter);
    setFormData({
      meterId: meter.meterId,
      propertyName: meter.propertyName,
      unitNumber: meter.unitNumber,
      meterType: meter.meterType,
      manufacturer: meter.manufacturer,
      model: meter.model,
      serialNumber: meter.serialNumber,
      notes: meter.notes,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (meter: WaterMeter) => {
    setSelectedMeter(meter);
    setShowDeleteDialog(true);
  };

  return (
    <DashboardLayout
      title="Water Meters"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Water Meters' },
      ]}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Meters</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by meter ID, unit, or serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[180px]">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="smart">Smart</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="analog">Analog</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Meter
          </Button>
        </div>

        {/* Meters Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meter ID</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Reading</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No water meters found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeters.map((meter) => (
                  <TableRow key={meter.id}>
                    <TableCell className="font-medium">{meter.meterId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {meter.propertyName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {meter.unitNumber}
                      </div>
                    </TableCell>
                    <TableCell>{getMeterTypeBadge(meter.meterType)}</TableCell>
                    <TableCell>
                      {meter.lastReadingDate ? (
                        <div>
                          <p className="font-medium">{meter.lastReading.toLocaleString()} m³</p>
                          <p className="text-xs text-muted-foreground">
                            {format(meter.lastReadingDate, 'MMM d, yyyy')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No readings</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(meter.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(meter)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => openDeleteDialog(meter)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setSelectedMeter(null);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{showEditDialog ? 'Edit Water Meter' : 'Add Water Meter'}</DialogTitle>
              <DialogDescription>
                {showEditDialog
                  ? 'Update the water meter details below.'
                  : 'Enter the details for the new water meter.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meterId">Meter ID</Label>
                  <Input
                    id="meterId"
                    value={formData.meterId}
                    onChange={(e) => setFormData({ ...formData, meterId: e.target.value })}
                    placeholder="WM-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="SN-2024-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyName">Property</Label>
                  <Input
                    id="propertyName"
                    value={formData.propertyName}
                    onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                    placeholder="Sunset Apartments"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitNumber">Unit Number</Label>
                  <Input
                    id="unitNumber"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    placeholder="A101"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meterType">Meter Type</Label>
                  <Select
                    value={formData.meterType}
                    onValueChange={(value: WaterMeter['meterType']) =>
                      setFormData({ ...formData, meterType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smart">Smart</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="analog">Analog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Sensus"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="iPERL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setShowEditDialog(false);
                  setSelectedMeter(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={showEditDialog ? handleEditMeter : handleAddMeter}>
                {showEditDialog ? 'Update Meter' : 'Add Meter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Water Meter</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete meter {selectedMeter?.meterId}? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMeter} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
