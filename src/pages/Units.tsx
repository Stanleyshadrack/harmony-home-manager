import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UnitCard } from '@/components/units/UnitCard';
import { RecordListTable } from '@/components/ui/record-list-table';
import { UnitForm } from '@/components/units/UnitForm';
import { useProperties, useUnits } from '@/hooks/useProperties';
import { Unit, UnitFormData } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Search, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function Units() {
  const [viewMode, setViewMode] = useViewMode('units');
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const propertyIdFromUrl = searchParams.get('property');
  
  const { properties } = useProperties();
  const { units, isLoading, loadError, addUnit, updateUnit, deleteUnit } = useUnits();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProperty, setFilterProperty] = useState<string>(propertyIdFromUrl || 'all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  const filteredUnits = units.filter((unit) => {
    const matchesSearch = 
      unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (unit.meterId ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesProperty = filterProperty === 'all' || unit.propertyId === filterProperty;
    const matchesStatus = filterStatus === 'all' || unit.status === filterStatus;
    
    return matchesSearch && matchesProperty && matchesStatus;
  });

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.name || 'Unknown Property';
  };

  const handleAddUnit = async (data: UnitFormData) => {
    try {
      await addUnit(data);
      toast.success('Unit added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add unit');
    }
  };

  const handleUpdateUnit = async (data: UnitFormData) => {
    if (!editingUnit) return;
    try {
      await updateUnit(editingUnit.id, data);
      toast.success('Unit updated successfully');
      setEditingUnit(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update unit');
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;
    try {
      await deleteUnit(deletingUnit.id);
      toast.success('Unit deleted successfully');
      setDeletingUnit(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete unit');
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingUnit(null);
  };

  // Stats
  const stats = {
    total: filteredUnits.length,
    occupied: filteredUnits.filter((u) => u.status === 'occupied').length,
    vacant: filteredUnits.filter((u) => u.status === 'vacant').length,
    maintenance: filteredUnits.filter((u) => u.status === 'maintenance').length,
  };

  return (
    <DashboardLayout
      title={t('units.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('units.title') },
      ]}
    >
      {loadError && <div role="alert" className="rounded-lg border border-destructive/50 p-3 mb-4 text-sm text-destructive">Units could not be loaded: {loadError}</div>}
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-card border rounded-lg">
          <p className="text-sm text-muted-foreground">{t('properties.totalUnits')}</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 bg-card border rounded-lg">
          <p className="text-sm text-muted-foreground">{t('units.occupied')}</p>
          <p className="text-2xl font-bold text-success">{stats.occupied}</p>
        </div>
        <div className="p-4 bg-card border rounded-lg">
          <p className="text-sm text-muted-foreground">{t('units.vacant')}</p>
          <p className="text-2xl font-bold text-info">{stats.vacant}</p>
        </div>
        <div className="p-4 bg-card border rounded-lg">
          <p className="text-sm text-muted-foreground">{t('units.maintenance')}</p>
          <p className="text-2xl font-bold text-warning">{stats.maintenance}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${t('common.search')} ${t('units.title').toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')} Properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')} Status</SelectItem>
            <SelectItem value="vacant">{t('units.vacant')}</SelectItem>
            <SelectItem value="occupied">{t('units.occupied')}</SelectItem>
            <SelectItem value="maintenance">{t('units.maintenance')}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('units.addUnit')}
        </Button>
      </div>

      <div className="flex justify-end mb-3"><ViewModeToggle value={viewMode} onChange={setViewMode} /></div>
      {/* Units Grid */}
      {filteredUnits.length > 0 ? (
        viewMode === 'list' ? (
          <RecordListTable records={filteredUnits} getKey={unit=>unit.id}
            columns={[
              {key:'number',header:'Unit',render:unit=><span className="font-medium">{unit.unitNumber}</span>},
              {key:'property',header:'Property',render:unit=>getPropertyName(unit.propertyId)},
              {key:'type',header:'Type',render:unit=>unit.unitType},
              {key:'rent',header:'Monthly Rent',render:unit=>`KES ${(Number(unit.monthlyRent)||0).toLocaleString('en-KE')}`},
              {key:'deposit',header:'Deposit',render:unit=>`KES ${(Number(unit.deposit)||0).toLocaleString('en-KE')}`},
              {key:'status',header:'Status',render:unit=><span className="capitalize">{unit.status.replaceAll('_',' ')}</span>},
              {key:'meter',header:'Meter',render:unit=>unit.meterName||unit.meterId||'—'},
            ]}
            actions={unit=>[
              {label:'Edit unit',onSelect:()=>handleEdit(unit)},
              {label:'Delete unit',separatorBefore:true,destructive:true,onSelect:()=>setDeletingUnit(unit)}
            ]}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUnits.map(unit=><UnitCard key={unit.id} unit={unit}
              propertyName={getPropertyName(unit.propertyId)} onEdit={handleEdit} onDelete={setDeletingUnit}/>)}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Home className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No units found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterProperty !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first unit'}
          </p>
          {!searchQuery && filterProperty === 'all' && filterStatus === 'all' && (
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('units.addUnit')}
            </Button>
          )}
        </div>
      )}

      {/* Unit Form Dialog */}
    <UnitForm
  open={isFormOpen}
  onOpenChange={handleCloseForm}
  unit={editingUnit}
  properties={properties}
  defaultPropertyId={
    filterProperty !== 'all'
      ? Number(filterProperty)
      : undefined
  }
  onSubmit={editingUnit ? handleUpdateUnit : handleAddUnit}
  isLoading={isLoading}
/>


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUnit} onOpenChange={() => setDeletingUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete unit "{deletingUnit?.unitNumber}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
