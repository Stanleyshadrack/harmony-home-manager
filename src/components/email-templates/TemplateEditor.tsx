import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Variable, Mail, Eye, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { MessageTemplate } from '@/hooks/useTemplates';

/* ========================================================
   TEMPLATE EDITOR DIALOG
======================================================== */

const categories = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Billing & Invoices' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'lease', label: 'Lease & Compliance' },
];

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  messageFormat: z.string().min(10, 'Message format must be at least 10 characters'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: MessageTemplate | null;
  onSave: (data: TemplateFormData) => void;
}

export function TemplateEditor({ open, onOpenChange, template, onSave }: TemplateEditorProps) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: template ? {
      name: template.name,
      category: template.category,
      description: template.description || '',
      messageFormat: template.messageFormat,
    } : {
      name: '',
      category: 'general',
      description: '',
      messageFormat: '',
    },
  });

  const watchMessage = form.watch('messageFormat');
  
  const extractedVariables = (() => {
    const text = watchMessage || '';
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
    return [...new Set(vars)];
  })();

  const handleSubmit = (data: TemplateFormData) => {
    onSave(data);
    onOpenChange(false);
    form.reset();
  };

  const insertVariable = (variable: string) => {
    const currentBody = form.getValues('messageFormat');
    form.setValue('messageFormat', currentBody + `{{${variable}}}`);
  };

  const commonVariables = ['name', 'unit', 'property', 'amount', 'balance', 'dueDate', 'customMessage'];

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
                        <Input placeholder="e.g., Rent Reminder" {...field} />
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

              <div className="space-y-3 pt-2">
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

              <FormField
                control={form.control}
                name="messageFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Format</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Hi {{name}}, your rent of KES {{amount}} is due..."
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

/* ========================================================
   TEMPLATE PREVIEW DIALOG
======================================================== */

interface TemplatePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: MessageTemplate | null;
}

export function TemplatePreview({ open, onOpenChange, template }: TemplatePreviewProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  if (!template) return null;

  const variables = template.messageFormat.match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/\{\{|\}\}/g, '')) || [];
  const uniqueVariables = [...new Set(variables)];

  const replaceVariables = (text: string) => {
    let result = text;
    uniqueVariables.forEach((v) => {
      const value = variableValues[v] || `{{${v}}}`;
      result = result.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), value);
    });
    return result;
  };

  const previewBody = replaceVariables(template.messageFormat);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5 text-primary" />
            Template Preview: {template.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="source" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Source
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[calc(90vh-200px)] mt-4">
            <TabsContent value="preview" className="space-y-4 mt-0">
              {uniqueVariables.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-3">
                    <Variable className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Test Variables</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {uniqueVariables.map((v) => (
                      <div key={v} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{v}</Label>
                        <Input
                          placeholder={`Enter ${v}`}
                          className="h-8 text-sm"
                          value={variableValues[v] || ''}
                          onChange={(e) => 
                            setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden bg-background shadow-sm p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                  {previewBody}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="source" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Raw Message Format</Label>
                  <div className="p-4 rounded-lg bg-muted/50 border font-mono text-sm whitespace-pre-wrap">
                    {template.messageFormat}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Variables Used</Label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueVariables.map((v) => (
                      <Badge key={v} variant="outline" className="font-mono">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                    {uniqueVariables.length === 0 && (
                      <p className="text-sm text-muted-foreground">No variables used.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}