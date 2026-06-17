import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Trash2, 
  Eye,
  Mail,
  Shield,
  CreditCard,
  Wrench,
  Bell,
  Megaphone
} from 'lucide-react';
import { MessageTemplate } from '@/hooks/useTemplates';

const categoryIcons: Record<string, any> = {
  general: Megaphone,
  billing: CreditCard,
  maintenance: Wrench,
  lease: Shield,
  system: Bell,
};

const categoryColors: Record<string, string> = {
  general: 'bg-info/10 text-info border-info/20',
  billing: 'bg-success/10 text-success border-success/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  lease: 'bg-primary/10 text-primary border-primary/20',
  system: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface TemplateCardProps {
  template: MessageTemplate;
  onEdit: (template: MessageTemplate) => void;
  onPreview: (template: MessageTemplate) => void;
  onDelete: (id: number) => void;
}

export function TemplateCard({ template, onEdit, onPreview, onDelete }: TemplateCardProps) {
  const CategoryIcon = categoryIcons[template.category?.toLowerCase()] || Bell;
  const colorClass = categoryColors[template.category?.toLowerCase()] || categoryColors.general;

  // Dynamically count variables
  const variables = template.messageFormat.match(/\{\{(\w+)\}\}/g) || [];
  const uniqueVariables = new Set(variables).size;

  return (
    <Card className="group transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        {template.description ? (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {template.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-4 italic">No description provided.</p>
        )}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`text-xs capitalize ${colorClass}`}>
            {template.category}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{uniqueVariables} variables</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}