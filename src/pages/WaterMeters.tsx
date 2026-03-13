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
import { useProperties, useUnits } from "@/hooks/useProperties";
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
import { useMeters } from "@/hooks/useMeters";
import { WaterMeter } from "@/api/dto/WaterMeterDTO";
import { MeterForm } from '@/types/MeterForm';



export default function WaterMeters() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { meters, stats, loading, createMeter, updateMeter, deleteMeter } = useMeters();
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { properties } = useProperties();
  const { units } = useUnits();
  const [selectedMeter, setSelectedMeter] = useState<WaterMeter | null>(null);
  const [formData, setFormData] = useState<MeterForm>({
    meterId: "",
    propertyId: "",
    meterType: "DIGITAL",
    manufacturer: "",
    model: "",
    serialNumber: "",
    notes: "",
    lastReading:0
  });

  const resetForm = () => {
    setFormData({
      meterId: "",
      propertyId: "",
      meterType: "DIGITAL",
      manufacturer: "",
      model: "",
      serialNumber: "",
      notes: "",
      lastReading:0
    });
  };



  const propertyMap = useMemo(() => {
    const map = new Map();
    properties.forEach(p => map.set(p.id, p));
    return map;
  }, [properties]);

  const unitMap = useMemo(() => {
    const map = new Map();
    units.forEach(u => map.set(u.id, u));
    return map;
  }, [units]);


  const filteredMeters = useMemo(() => {
    return meters.filter((m) => {
      const matchesSearch =
        m.meterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unitMap.get(m.unitId)?.unitNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        propertyMap.get(m.propertyId)?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        m.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProperty = propertyFilter === 'all' || m.propertyId === propertyFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesType = typeFilter === 'all' || m.meterType === typeFilter;
      return matchesSearch && matchesProperty && matchesStatus && matchesType;
    });
  }, [
    meters,
    searchQuery,
    propertyFilter,
    statusFilter,
    typeFilter,
    propertyMap,
    unitMap
  ]);



  const getStatusBadge = (status: WaterMeter['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case 'MAINTENANCE':
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
      case 'SMART':
        return <Badge variant="outline" className="border-primary/50 text-primary">Smart</Badge>;
      case 'DIGITAL':
        return <Badge variant="outline">Digital</Badge>;
      case 'ANALOG':
        return <Badge variant="outline" className="border-muted-foreground/50">Analog</Badge>;
    }
  };

  const sortedMeters = useMemo(() => {
    return [...filteredMeters].sort((a, b) =>
      a.meterId.localeCompare(b.meterId)
    );
  }, [filteredMeters]);



  const handleAddMeter = async () => {
   if (!formData.meterId || !formData.propertyId) {
      toast({
        title: "Validation Error",
       description: "Meter ID and property are required.",
        variant: "destructive",
      });
      return;
    }
    const newMeter: Partial<WaterMeter> = {
      meterId: formData.meterId,
  propertyId: formData.propertyId,
  meterType: formData.meterType,
  manufacturer: formData.manufacturer,
  model: formData.model,
  serialNumber: formData.serialNumber,
  notes: formData.notes,
  lastReading: formData.lastReading,
    };

    await createMeter(newMeter as WaterMeter);

    setShowAddDialog(false);
    resetForm();
    toast({
      title: 'Meter Added',
      description: `Water meter ${formData.meterId} has been added successfully.`,
    });
  };

  const handleEditMeter = async () => {
    if (!selectedMeter) return;

    const updated: Partial<WaterMeter> = {
      meterId: formData.meterId,
      propertyId: formData.propertyId,
      meterType: formData.meterType,
      manufacturer: formData.manufacturer,
      model: formData.model,
      serialNumber: formData.serialNumber,
      notes: formData.notes,
       lastReading: formData.lastReading,
    };

    await updateMeter(Number(selectedMeter.id), {
      ...selectedMeter,
      ...updated,
    });

    setShowEditDialog(false);
    setSelectedMeter(null);
    resetForm();
    toast({
      title: 'Meter Updated',
      description: 'Water meter has been updated successfully.',
    });
  };

  const handleDeleteMeter = async () => {
    if (!selectedMeter) return;

    await deleteMeter(Number(selectedMeter.id));

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
  meterId: meter.meterId ?? "",
  propertyId: meter.propertyId ?? "",
  meterType: meter.meterType ?? "DIGITAL",
  manufacturer: meter.manufacturer ?? "",
  model: meter.model ?? "",
  serialNumber: meter.serialNumber ?? "",
  notes: meter.notes ?? "",
  lastReading: meter.lastReading ?? 0,
});

    setShowEditDialog(true);
  };

  const openDeleteDialog = (meter: WaterMeter) => {
    setSelectedMeter(meter);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <DashboardLayout title="Water Meters">
        <div className="p-6 text-muted-foreground">
          Loading water meters...
        </div>
      </DashboardLayout>
    );
  }


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
                <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
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
                <p className="text-2xl font-bold">{stats?.active ?? 0}</p>
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
                <p className="text-2xl font-bold">{stats?.inactive ?? 0}</p>
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
                <p className="text-2xl font-bold">{stats?.maintenance ?? 0}</p>
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
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
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
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="SMART">Smart</SelectItem>
              <SelectItem value="DIGITAL">Digital</SelectItem>
              <SelectItem value="ANALOG">Analog</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
            className="gap-2">
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
                sortedMeters.map((meter) => (
                  <TableRow key={meter.id}>
                    <TableCell className="font-medium">{meter.meterId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {propertyMap.get(meter.propertyId)?.name ?? meter.propertyId}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {meter.unitId ? (
  unitMap.get(meter.unitId)?.unitNumber ?? meter.unitId
) : (
  <Badge variant="outline">Unassigned</Badge>
)}
                      </div>
                    </TableCell>
                    <TableCell>{getMeterTypeBadge(meter.meterType)}</TableCell>
                    <TableCell>
                      {meter.lastReadingDate ? (
                        <div>
                          <p className="font-medium">
                            {(meter.lastReading ?? 0).toLocaleString()} m³
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {format(meter.lastReadingDate, "MMM d, yyyy")}
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
                  <Select
                    value={formData.propertyId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, propertyId: value })
                    }

                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Property" />
                    </SelectTrigger>

                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="SMART">Smart</SelectItem>
                      <SelectItem value="DIGITAL">Digital</SelectItem>
                      <SelectItem value="ANALOG">Analog</SelectItem>
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
  <Label htmlFor="lastReading">Last Reading</Label>

  <Input
    id="lastReading"
    type="number"
    value={formData.lastReading}
    onChange={(e) =>
      setFormData({
        ...formData,
        lastReading: Number(e.target.value),
      })
    }
    placeholder="0"
  />

  <p className="text-xs text-muted-foreground">
    Initial meter reading (can be edited)
  </p>
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
