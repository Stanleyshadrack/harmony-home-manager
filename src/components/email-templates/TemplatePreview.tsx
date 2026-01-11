import { EmailTemplate } from '@/types/emailTemplate';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useMemo } from 'react';
import { Mail, Variable, Eye, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TemplatePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
}

export function TemplatePreview({ open, onOpenChange, template }: TemplatePreviewProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  if (!template) return null;

  const replaceVariables = (text: string) => {
    let result = text;
    template.variables.forEach((v) => {
      const value = variableValues[v] || `{{${v}}}`;
      result = result.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), value);
    });
    return result;
  };

  const previewSubject = replaceVariables(template.subject);
  const previewBody = replaceVariables(template.body);

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
              {template.variables.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-3">
                    <Variable className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Test Variables</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {template.variables.map((v) => (
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

              <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
                {/* Email Header */}
                <div className="bg-muted/30 border-b px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-16">From:</span>
                    <span className="text-sm">PropManager &lt;noreply@propmanager.com&gt;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-16">To:</span>
                    <span className="text-sm">recipient@example.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-16">Subject:</span>
                    <span className="text-sm font-medium">{previewSubject}</span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                    {previewBody}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="source" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subject Template</Label>
                  <div className="p-3 rounded-lg bg-muted/50 border font-mono text-sm">
                    {template.subject}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Body Template</Label>
                  <div className="p-4 rounded-lg bg-muted/50 border font-mono text-sm whitespace-pre-wrap">
                    {template.body}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Variables Used</Label>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((v) => (
                      <Badge key={v} variant="outline" className="font-mono">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
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
