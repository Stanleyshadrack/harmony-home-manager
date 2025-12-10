import { Tenant } from '@/types/tenant';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, Edit, Mail, Phone, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TenantCardProps {
  tenant: Tenant;
  onView: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}

const statusColors = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  inactive: 'bg-muted text-muted-foreground border-muted',
};

export function TenantCard({ tenant, onView, onEdit, onDelete }: TenantCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={tenant.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {tenant.firstName[0]}
                {tenant.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {tenant.firstName} {tenant.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tenant.unitNumber} • {tenant.propertyName}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(tenant)}>
                <Eye className="h-4 w-4 mr-2" />
                {t('common.view')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(tenant)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(tenant)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{tenant.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{tenant.phone}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant="outline" className={statusColors[tenant.status]}>
            {tenant.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Move in: {new Date(tenant.moveInDate).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
