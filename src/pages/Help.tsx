import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/api/https';
import { toast } from 'sonner';
import { HelpCircle, MessageCircle, FileText, Mail, Loader2 } from 'lucide-react';

type Ticket = { id:number; requesterId:number; subject:string; description:string; status:string;
  response:string|null; createdAt:string; updatedAt:string; };
const FAQs = [
  { question:'How do I view my units and properties?', answer:'Open Properties or Units from the sidebar. Access depends on your account role and property assignments.' },
  { question:'Where are rent invoices and payments?', answer:'Open Billing to view invoices and available payment records. Tenants may see their own billing through the Tenant Portal.' },
  { question:'How do I report a maintenance issue?', answer:'Use Maintenance from the sidebar where permitted, or send a support request below if you cannot access it.' },
  { question:'How can I update my contact information?', answer:'Open Settings and select Edit Profile to update your name, phone number or avatar.' },
  { question:'Why can I not access a page?', answer:'Some areas are restricted by role or assigned properties. Contact your administrator if your access appears incorrect.' },
];
const docs = [
  { title:'Getting started', detail:'Sign in through the approved account invitation and complete any required verification before using your dashboard.' },
  { title:'Property operations', detail:'Property managers can navigate Properties, Units and Tenants to review their assigned portfolio.' },
  { title:'Billing and water', detail:'Use Billing, Water Data and Water Meters according to your assigned permissions. Check the billing period before posting changes.' },
  { title:'Notifications', detail:'Use Notifications to contact eligible assigned tenants; review Notification Logs to see recorded attempts and statuses.' },
  { title:'Security', detail:'Never share your password or one-time code. Sign out after using a shared device and report suspicious activity.' },
];
export default function Help() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [section,setSection] = useState<'docs'|'faq'|'tickets'>('faq');
  const [query,setQuery] = useState('');
  const [tickets,setTickets] = useState<Ticket[]>([]);
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [subject,setSubject] = useState('');
  const [description,setDescription] = useState('');
  const [responses,setResponses] = useState<Record<number,string>>({});
  const [statuses,setStatuses] = useState<Record<number,string>>({});
  const admin = user?.role === 'super_admin';

  async function loadTickets() {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<null,Ticket[]>({path:'/api/account-support/tickets',method:'GET'});
      setTickets(result);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load support tickets'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadTickets(); }, [user?.id]);

  const filteredFaqs = useMemo(() => FAQs.filter(x => (x.question+' '+x.answer).toLowerCase().includes(query.toLowerCase())),[query]);
  const filteredDocs = useMemo(() => docs.filter(x => (x.title+' '+x.detail).toLowerCase().includes(query.toLowerCase())),[query]);

  async function createTicket(e:React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSaving(true);
    try {
      await apiRequest({path:'/api/account-support/tickets',method:'POST',body:{subject:subject.trim(),description:description.trim()}});
      setSubject(''); setDescription('');
      toast.success('Support request submitted');
      await loadTickets();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not submit support request'); }
    finally { setSaving(false); }
  }
  async function reply(id:number) {
    const response = responses[id]?.trim();
    if (!response) return;
    setSaving(true);
    try {
      await apiRequest({path:`/api/account-support/tickets/${id}/reply`,method:'PATCH',body:{response,status:statuses[id] || 'IN_PROGRESS'}});
      toast.success('Support response saved');
      await loadTickets();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Unable to save response'); }
    finally { setSaving(false); }
  }
  return (
    <DashboardLayout title={t('navigation.help')}
      breadcrumbs={[{label:t('navigation.dashboard'),href:'/dashboard'},{label:t('navigation.help')}]}>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {id:'docs' as const,title:'Documentation',icon:FileText,desc:'Guides for property management'},
          {id:'faq' as const,title:'FAQs',icon:MessageCircle,desc:'Answers to common questions'},
          {id:'tickets' as const,title:'Contact Support',icon:Mail,desc:'Submit and track support requests'}
        ].map(item=><Card key={item.id}><CardHeader><CardTitle className="flex items-center gap-2"><item.icon className="h-5 w-5 text-primary"/>{item.title}</CardTitle><CardDescription>{item.desc}</CardDescription></CardHeader>
          <CardContent><Button className="w-full" variant={section===item.id?'default':'outline'} onClick={()=>setSection(item.id)}>Open {item.title}</Button></CardContent></Card>)}
      </div>
      {section!=='tickets' && <Card className="mt-6"><CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5"/>{section==='faq'?'Frequently Asked Questions':'Documentation'}</CardTitle></CardHeader>
        <CardContent className="space-y-4"><Input aria-label="Search help" placeholder="Search help resources" value={query} onChange={e=>setQuery(e.target.value)}/>
          {(section==='faq'?filteredFaqs.map((x,i)=><div key={i} className="rounded-lg border p-4"><h3 className="font-semibold">{x.question}</h3><p className="text-sm text-muted-foreground mt-2">{x.answer}</p></div>):filteredDocs.map((x,i)=><div key={i} className="rounded-lg border p-4"><h3 className="font-semibold">{x.title}</h3><p className="text-sm text-muted-foreground mt-2">{x.detail}</p></div>))}
        </CardContent></Card>}
      {section==='tickets' && <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <Card><CardHeader><CardTitle>New support request</CardTitle><CardDescription>Requests are saved to your account and tracked by support.</CardDescription></CardHeader>
          <CardContent><form onSubmit={createTicket} className="space-y-4">
            <div><Label htmlFor="support-subject">Subject</Label><Input id="support-subject" maxLength={180} required value={subject} onChange={e=>setSubject(e.target.value)}/></div>
            <div><Label htmlFor="support-description">Describe the issue</Label><Textarea id="support-description" required maxLength={5000} rows={6} value={description} onChange={e=>setDescription(e.target.value)}/></div>
            <Button disabled={saving} type="submit">{saving?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:null}Submit request</Button>
          </form></CardContent></Card>
        <Card><CardHeader><CardTitle>{admin?'All support tickets':'My support tickets'}</CardTitle><CardDescription>Ticket statuses and responses are retrieved from the server.</CardDescription></CardHeader>
          <CardContent className="space-y-4"><Button variant="outline" size="sm" onClick={()=>void loadTickets()} disabled={loading}>Refresh</Button>
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            {loading && <p className="text-sm text-muted-foreground">Loading tickets…</p>}
            {!loading && tickets.length===0 && <p className="text-sm text-muted-foreground">No support tickets yet.</p>}
            {tickets.map(ticket=><div key={ticket.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between gap-2"><strong>#{ticket.id}: {ticket.subject}</strong><Badge variant="outline">{ticket.status}</Badge></div>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              <p className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleString()}</p>
              {ticket.response && <div className="rounded bg-muted p-3"><strong className="text-sm">Support response</strong><p className="text-sm whitespace-pre-wrap">{ticket.response}</p></div>}
              {admin && <div className="space-y-2"><Label>Respond to ticket</Label><Textarea value={responses[ticket.id] || ''} maxLength={5000} onChange={e=>setResponses(p=>({...p,[ticket.id]:e.target.value}))}/>
                <select className="w-full border rounded bg-background p-2" value={statuses[ticket.id] || 'IN_PROGRESS'} onChange={e=>setStatuses(p=>({...p,[ticket.id]:e.target.value}))}><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select>
                <Button disabled={saving || !responses[ticket.id]?.trim()} onClick={()=>void reply(ticket.id)}>Save response</Button>
              </div>}
            </div>)}
          </CardContent></Card>
      </div>}
    </DashboardLayout>
  );
}
