import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EmailTemplate, EmailTemplateCategory, EmailTemplateFormData } from '@/types/emailTemplate';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Info, Variable } from 'lucide-react';

const categories: { value: EmailTemplateCategory; label: string }[] = [
  { value: 'authentication', label: 'Authentication' },
  { value: 'billing', label: 'Billing' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'system', label: 'System' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'invitation', label: 'Invitation' },
];

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  category: z.enum(['authentication', 'billing', 'maintenance', 'system', 'subscription', 'invitation']),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(10, 'Body must be at least 10 characters'),
  description: z.string().optional(),
});

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate | null;
  onSave: (data: EmailTemplateFormData) => void;
}

export function TemplateEditor({ open, onOpenChange, template, onSave }: TemplateEditorProps) {
  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: template ? {
      name: template.name,
      category: template.category,
      subject: template.subject,
      body: template.body,
      description: template.description || '',
    } : {
      name: '',
      category: 'system',
      subject: '',
      body: '',
      description: '',
    },
  });

  const watchBody = form.watch('body');
  const watchSubject = form.watch('subject');
  
  const extractedVariables = (() => {
    const text = (watchBody || '') + (watchSubject || '');
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
    return [...new Set(vars)];
  })();

  const handleSubmit = (data: EmailTemplateFormData) => {
    onSave(data);
    onOpenChange(false);
    form.reset();
  };

  const insertVariable = (variable: string) => {
    const currentBody = form.getValues('body');
    form.setValue('body', currentBody + `{{${variable}}}`);
  };

  const commonVariables = ['userName', 'appName', 'timestamp', 'propertyName', 'unitNumber', 'tenantName'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Welcome Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of when this template is used" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Welcome to {{appName}}!" {...field} />
                    </FormControl>
                    <FormDescription className="flex items-center gap-1 text-xs">
                      <Info className="h-3 w-3" />
                      Use {"{{variableName}}"} for dynamic content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Body</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your email template here..."
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Variable className="h-4 w-4" />
                  Quick Insert Variables
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonVariables.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => insertVariable(v)}
                    >
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {extractedVariables.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Detected Variables ({extractedVariables.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {extractedVariables.map((v) => (
                        <Badge key={v} variant="secondary" className="font-mono text-xs">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {template ? 'Save Changes' : 'Create Template'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
