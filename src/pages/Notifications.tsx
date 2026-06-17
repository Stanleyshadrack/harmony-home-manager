import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Users,
  RefreshCw,
  FileText,
  Megaphone,
  CalendarClock,
  Droplets,
  Wrench,
  Check,
  DollarSign,
  Building2,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications } from '@/hooks/useNotifications';
import { useTenants } from '@/hooks/useTenants';
import { useToast } from '@/hooks/use-toast';
import { useTemplates } from '@/hooks/useTemplates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getTemplateIcon = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('billing')) return DollarSign;
  if (cat.includes('lease')) return CalendarClock;
  if (cat.includes('maintenance')) return Wrench;
  if (cat.includes('general')) return Megaphone;
  if (cat.includes('water')) return Droplets;
  return Bell;
};

const Notifications = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { tenants, isLoading: loadingTenants } = useTenants();
  const { createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const { 
    logs, 
    templates, 
    isLoading: loadingNotifications, 
    sendSingle, 
    sendBulk, 
    refreshLogs 
  } = useNotifications();
  
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [notificationType, setNotificationType] = useState('General Notice');
  const [channel, setChannel] = useState('sms');
  const [customMessage, setCustomMessage] = useState('');

  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  const [bulkChannel, setBulkChannel] = useState('sms');
  const [bulkCustomMessage, setBulkCustomMessage] = useState('');
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Template Management State
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'General',
    messageFormat: ''
  });

  // 🔥 DELETION CONFIRMATION STATE
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageTemplates = user?.role === 'super_admin' || user?.role === 'landlord';

  const mappedTenants = tenants.map((t: any) => ({
    id: Number(t.id),
    name: `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Unknown Tenant',
    phone: t.phone || 'No phone',
    unit: t.unitNumber || 'No unit assigned',
    property: t.propertyName || 'No property assigned',
    balance: t.balance || 0,
  }));

  const handleSendSingle = async () => {
    if (!selectedTenant) {
      toast({ title: 'Please select a tenant', variant: 'destructive' });
      return;
    }
    try {
      await sendSingle({
        tenantId: Number(selectedTenant),
        channel,
        title: notificationType,
        message: customMessage
      });
      toast({ title: 'Notification sent successfully' });
      setCustomMessage('');
    } catch (error: any) {}
  };

  const handleSelectAllTenants = (checked: boolean) => {
    if (checked) setSelectedTenants(mappedTenants.map(t => t.id));
    else setSelectedTenants([]);
  };

  const handleToggleTenant = (tenantId: number) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) ? prev.filter(id => id !== tenantId) : [...prev, tenantId]
    );
  };

  const handleSendBulkNotifications = async () => {
    if (selectedTenants.length === 0 || !selectedTemplate) {
      toast({ title: 'Selection required', variant: 'destructive' });
      return;
    }
    setIsSendingBulk(true);
    try {
      await sendBulk({
        templateId: selectedTemplate,
        tenantIds: selectedTenants,
        channel: bulkChannel,
        meta: { customMessage: bulkCustomMessage }
      });
      setSelectedTenants([]);
      setSelectedTemplate(null);
      setBulkCustomMessage('');
    } catch (error) {
    } finally {
      setIsSendingBulk(false);
    }
  };

  // Template CRUD Actions
  const handleOpenCreate = () => {
    setEditingTemplateId(null);
    setTemplateForm({ name: '', description: '', category: 'General', messageFormat: '' });
    setIsTemplateDialogOpen(true);
  };

  const handleOpenEdit = (template: any) => {
    setEditingTemplateId(template.id);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category: template.category,
      messageFormat: template.messageFormat
    });
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.messageFormat) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    try {
      if (editingTemplateId) {
        await updateTemplate({ id: editingTemplateId, data: templateForm });
        toast({ title: "Template updated" });
      } else {
        await createTemplate(templateForm);
        toast({ title: "Template created" });
      }
      setIsTemplateDialogOpen(false);
    } catch (error) {
      toast({ title: "Operation failed", variant: "destructive" });
    }
  };

  // 🔥 TRIGGER DELETE DIALOG (Instead of window.confirm)
  const triggerDeleteDialog = (template: any) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTemplate(templateToDelete.id);
      toast({ title: "Template deleted successfully" });
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const currentTemplate = templates.find((t: any) => t.id === selectedTemplate);
  const isPageLoading = loadingTenants || loadingNotifications;

  const breadcrumbs = [{ label: t('nav.dashboard'), href: '/dashboard' }, { label: 'Notifications' }];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messaging & Alerts</h1>
            <p className="text-muted-foreground">Communicate with your tenants via SMS, WhatsApp, or Email</p>
          </div>
        </div>

        <Tabs defaultValue="bulk" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="bulk" className="gap-2"><Users className="h-4 w-4" /> Bulk Send</TabsTrigger>
            <TabsTrigger value="templates" className="gap-2"><FileText className="h-4 w-4" /> Templates</TabsTrigger>
            <TabsTrigger value="single" className="gap-2"><Send className="h-4 w-4" /> Single Send</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><Clock className="h-4 w-4" /> History</TabsTrigger>
          </TabsList>

          {/* BULK SEND TAB */}
          <TabsContent value="bulk" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1 h-fit">
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> 1. Select Template</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {templates.length === 0 && !isPageLoading && <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg text-center">No templates available.</p>}
                  {templates.map((template: any) => {
                    const Icon = getTemplateIcon(template.category);
                    return (
                      <div key={template.id} onClick={() => setSelectedTemplate(template.id)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTemplate === template.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50 hover:bg-muted/50'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${selectedTemplate === template.id ? 'bg-primary/10' : 'bg-muted'}`}><Icon className={`h-4 w-4 ${selectedTemplate === template.id ? 'text-primary' : 'text-muted-foreground'}`} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{template.name}</p>
                            <Badge variant="secondary" className="mt-1 text-[10px] capitalize">{template.category}</Badge>
                          </div>
                          {selectedTemplate === template.id && <Check className="h-4 w-4 text-primary shrink-0 mt-1" />}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> 2. Select Recipients</CardTitle>
                      <CardDescription className="mt-1">{selectedTenants.length} of {mappedTenants.length} tenants selected</CardDescription>
                    </div>
                    <Select value={bulkChannel} onValueChange={setBulkChannel}>
                      <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms"><div className="flex items-center gap-2"><Phone className="h-4 w-4" /> SMS</div></SelectItem>
                        <SelectItem value="whatsapp"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> WhatsApp</div></SelectItem>
                        <SelectItem value="email"><div className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-12"><Checkbox checked={selectedTenants.length === mappedTenants.length && mappedTenants.length > 0} onCheckedChange={handleSelectAllTenants}/></TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Unit / Property</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mappedTenants.map((tenant) => (
                          <TableRow key={tenant.id} className={selectedTenants.includes(tenant.id) ? 'bg-primary/5' : ''}>
                            <TableCell><Checkbox checked={selectedTenants.includes(tenant.id)} onCheckedChange={() => handleToggleTenant(tenant.id)}/></TableCell>
                            <TableCell className="font-medium">{tenant.name}</TableCell>
                            <TableCell><div className="text-sm"><p className="font-medium">{tenant.unit}</p><p className="text-muted-foreground text-xs">{tenant.property}</p></div></TableCell>
                            <TableCell><p className="text-xs font-mono bg-muted px-2 py-1 rounded inline-block">{tenant.phone}</p></TableCell>
                            <TableCell className="text-right"><span className={tenant.balance ? 'text-destructive font-medium' : 'text-success'}>KES {tenant.balance.toLocaleString()}</span></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {currentTemplate?.category?.toLowerCase() === 'general' && (
                    <div className="mt-6 space-y-2">
                      <Label>Announcement Message Body</Label>
                      <Textarea placeholder="Enter announcement details..." value={bulkCustomMessage} onChange={(e) => setBulkCustomMessage(e.target.value)} rows={3} />
                    </div>
                  )}
                  {currentTemplate && selectedTenants.length > 0 && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Message Preview:</p>
                      <p className="text-sm font-mono whitespace-pre-wrap">{currentTemplate.messageFormat}</p>
                    </div>
                  )}
                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSendBulkNotifications} disabled={isSendingBulk || selectedTenants.length === 0 || !selectedTemplate} size="lg">
                      <Send className="h-4 w-4 mr-2" /> {isSendingBulk ? 'Sending...' : `Dispatch to ${selectedTenants.length} Tenants`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TEMPLATES TAB */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Message Templates</h2>
                <p className="text-sm text-muted-foreground">Manage pre-defined messages with dynamic variables.</p>
              </div>

              {canManageTemplates && (
                <Button onClick={handleOpenCreate} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Template
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template: any) => {
                const Icon = getTemplateIcon(template.category);
                return (
                  <Card key={template.id} className="relative overflow-hidden hover:shadow-md transition-shadow group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg"><Icon className="h-5 w-5 text-primary" /></div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <div className="flex gap-2 items-center mt-1">
                              <Badge variant="outline" className="text-[10px] capitalize">{template.category}</Badge>
                            </div>
                          </div>
                        </div>

                        {canManageTemplates && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(template)} className="gap-2">
                                <Pencil className="h-3.5 w-3.5" /> Edit Template
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => triggerDeleteDialog(template)} className="gap-2 text-destructive focus:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" /> Delete Template
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {template.description && <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1">{template.description}</p>}
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Raw Format:</p>
                        <p className="text-xs font-mono whitespace-pre-wrap line-clamp-4">{template.messageFormat}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* SINGLE SEND TAB */}
          <TabsContent value="single" className="space-y-4">
            <Card className="max-w-2xl">
              <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Send Custom Notification</CardTitle><CardDescription>Send a one-off message to a specific tenant.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label>Select Tenant</Label><Select value={selectedTenant} onValueChange={setSelectedTenant}><SelectTrigger><SelectValue placeholder="Search or choose a tenant" /></SelectTrigger><SelectContent>{mappedTenants.map(tenant => (<SelectItem key={tenant.id} value={tenant.id.toString()}>{tenant.name} ({tenant.unit})</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Delivery Channel</Label><Select value={channel} onValueChange={setChannel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sms"><div className="flex items-center gap-2"><Phone className="h-4 w-4" /> SMS</div></SelectItem><SelectItem value="whatsapp"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> WhatsApp</div></SelectItem><SelectItem value="email"><div className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</div></SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Message Subject / Title</Label><Input value={notificationType} onChange={(e) => setNotificationType(e.target.value)} /></div>
                <div className="space-y-2"><Label>Message Body</Label><Textarea placeholder="Type your complete message here..." value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={6} /></div>
                <Button onClick={handleSendSingle} disabled={isPageLoading || !selectedTenant || !customMessage} className="w-full sm:w-auto"><Send className="h-4 w-4 mr-2" /> Dispatch Notification</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-4">
            <Card className="border-muted shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b pb-4">
                <div><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Sent Logs</CardTitle><CardDescription>View the delivery status of broadcasts.</CardDescription></div>
                <Button variant="outline" size="sm" onClick={() => refreshLogs()} className="bg-background"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[550px]">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0 backdrop-blur-sm z-10"><TableRow><TableHead className="w-[140px]">Dispatched</TableHead><TableHead className="w-[200px]">Recipient</TableHead><TableHead className="w-[100px] text-center">Channel</TableHead><TableHead className="min-w-[250px]">Message</TableHead><TableHead className="w-[100px] text-center">Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {logs.length === 0 && !isPageLoading ? (<TableRow><TableCell colSpan={5} className="h-64 text-center">No logs found.</TableCell></TableRow>) : (
                        logs.map((log: any) => {
                          const tenant = mappedTenants.find((t) => t.name === log.recipient);
                          return (
                            <TableRow key={log.id} className="hover:bg-muted/30 transition-colors group">
                              <TableCell className="align-top pt-4">{log.createdAt ? (<div className="flex flex-col"><span className="font-medium text-sm">{format(new Date(log.createdAt), 'MMM d, yyyy')}</span><span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), 'HH:mm a')}</span></div>) : '—'}</TableCell>
                              <TableCell className="align-top pt-4"><div className="flex flex-col"><span className="font-medium text-sm">{log.recipient || 'Unknown'}</span>{tenant && <span className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> {tenant.unit}, {tenant.property}</span>}</div></TableCell>
                              <TableCell className="align-top pt-4 text-center"><Badge variant="secondary" className="uppercase text-[10px] tracking-wider font-semibold">{log.channel}</Badge></TableCell>
                              <TableCell className="align-top pt-4 max-w-[300px]"><div className="flex flex-col"><span className="font-semibold text-sm mb-1">{log.title}</span><div className="text-xs text-muted-foreground whitespace-normal break-words line-clamp-2 group-hover:line-clamp-none transition-all duration-200">{log.message}</div></div></TableCell>
                              <TableCell className="align-top pt-4 text-center">{log.read ? <Badge className="bg-success/15 text-success border-0">Read</Badge> : <Badge variant="outline" className="text-warning bg-warning/5">Delivered</Badge>}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* =====================================================
            MODALS & DIALOGS
        ===================================================== */}

        {/* Upsert Template Modal */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTemplateId ? 'Edit Template' : 'Create New Template'}</DialogTitle>
              <DialogDescription>Define dynamic variables using {"{{name}}"}, {"{{unit}}"}, and {"{{balance}}"}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Template Name *</Label><Input placeholder="e.g. Rent Reminder" value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Category</Label><Select value={templateForm.category} onValueChange={(val) => setTemplateForm({...templateForm, category: val})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Billing">Billing</SelectItem><SelectItem value="Lease">Lease</SelectItem><SelectItem value="Maintenance">Maintenance</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Description</Label><Input placeholder="Short summary..." value={templateForm.description} onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})} /></div>
              </div>
              <div className="space-y-2">
                <Label>Message Format *</Label>
                <Textarea rows={6} placeholder="Hi {{name}}, your balance for {{unit}} is {{balance}}..." value={templateForm.messageFormat} onChange={(e) => setTemplateForm({...templateForm, messageFormat: e.target.value})} />
                <p className="text-[10px] text-muted-foreground bg-muted p-2 rounded">
                  Available: <span className="font-mono text-primary">{"{{name}}, {{unit}}, {{property}}, {{balance}}, {{dueDate}}"}</span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveTemplate}>Save Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 🔥 NEW: Confirm Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <div className="flex items-center gap-3 text-destructive mb-2">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </div>
              <DialogDescription>
                Are you sure you want to delete the template <strong>"{templateToDelete?.name}"</strong>? 
                This action cannot be undone and this template will no longer be available for use.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Bell className="h-6 w-6 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-600">Twilio / Email Integration Notice</h3>
                <p className="text-sm text-amber-600/80 mt-1 leading-relaxed">Notifications are dispatched to in-app portals. Configure Twilio keys for SMS/WhatsApp.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;