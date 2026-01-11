import { useState } from 'react';
import { EmailTemplate } from '@/types/emailTemplate';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  Mail,
  Shield,
  CreditCard,
  Wrench,
  Bell,
  Crown,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';

const categoryIcons = {
  authentication: Shield,
  billing: CreditCard,
  maintenance: Wrench,
  system: Bell,
  subscription: Crown,
  invitation: UserPlus,
};

const categoryColors = {
  authentication: 'bg-info/10 text-info border-info/20',
  billing: 'bg-success/10 text-success border-success/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  system: 'bg-destructive/10 text-destructive border-destructive/20',
  subscription: 'bg-primary/10 text-primary border-primary/20',
  invitation: 'bg-accent/10 text-accent-foreground border-accent/20',
};

interface TemplateCardProps {
  template: EmailTemplate;
  onEdit: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export function TemplateCard({
  template,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
  onToggleActive,
}: TemplateCardProps) {
  const CategoryIcon = categoryIcons[template.category];

  return (
    <Card className={`group transition-all duration-200 hover:shadow-md hover:border-primary/30 ${!template.isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${categoryColors[template.category]}`}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {template.subject}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={template.isActive}
              onCheckedChange={() => onToggleActive(template.id)}
              className="data-[state=checked]:bg-success"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onPreview(template)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(template.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {template.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`text-xs ${categoryColors[template.category]}`}>
            {template.category}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{template.variables.length} variables</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Modified {format(new Date(template.lastModified), 'MMM d, yyyy')}
        </p>
      </CardContent>
    </Card>
  );
}
