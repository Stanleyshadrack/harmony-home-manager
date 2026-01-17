import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { useProperties } from '@/hooks/useProperties';
import { Property, PropertyFormData } from '@/types/property';
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
import { Plus, Search, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Properties() {
  const { t } = useTranslation();
  const { properties, isLoading, addProperty, updateProperty, deleteProperty } = useProperties();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);

  const q = searchQuery.toLowerCase();

const filteredProperties = properties.filter((property) => {
  const matchesSearch =
    property.name.toLowerCase().includes(q) ||
    property.address.toLowerCase().includes(q) ||
    property.city.toLowerCase().includes(q);

  const matchesType =
    filterType === 'all' || property.propertyType === filterType;

  return matchesSearch && matchesType;


  });


  const handleUpdateProperty = async (data: PropertyFormData) => {
    if (!editingProperty) return;
    try {
      await updateProperty(editingProperty.id, data);
      toast.success('Property updated successfully');
      setEditingProperty(null);
    } catch (error) {
      toast.error('Failed to update property');
    }
  };

  const handleDeleteProperty = async () => {
    if (!deletingProperty) return;
    try {
      await deleteProperty(deletingProperty.id);
      toast.success('Property deleted successfully');
      setDeletingProperty(null);
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingProperty(null);
  };

  return (
    <DashboardLayout
      title={t('properties.title')}
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('properties.title') },
      ]}
    >
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${t('common.search')} ${t('properties.title').toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('common.filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')} Types</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="mixed">Mixed Use</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('properties.addProperty')}
        </Button>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={handleEdit}
              onDelete={setDeletingProperty}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No properties found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first property'}
          </p>
          {!searchQuery && filterType === 'all' && (
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('properties.addProperty')}
            </Button>
          )}
        </div>
      )}

      {/* Property Form Dialog */}
     <PropertyForm
  open={isFormOpen}
  onOpenChange={handleCloseForm}
  property={editingProperty}
/>


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProperty} onOpenChange={() => setDeletingProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProperty?.name}"? This action cannot be undone
              and will also delete all associated units.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
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
