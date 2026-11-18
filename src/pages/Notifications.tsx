import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Send, RefreshCw, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { notificationOperationsApi, NotificationRecipient, DeliveryResult } from "@/api/service/notificationOperationsApi";

const presets = [
  { name: "Rent Reminder", title: "Rent Payment Reminder", message: "This is a reminder that your rent payment is due. Please check your statement and contact property management if you have questions." },
  { name: "Overdue Notice", title: "Outstanding Rent Notice", message: "Our records show an outstanding balance on your account. Please contact property management to confirm the amount and arrange payment." },
  { name: "Lease Renewal", title: "Lease Renewal Reminder", message: "Your lease may be approaching renewal. Please contact property management to review your lease terms." },
  { name: "Water Bill", title: "Water Bill Update", message: "Your water bill information is available in your tenant portal. Please review the latest charges." },
  { name: "Maintenance", title: "Maintenance Update", message: "Please contact the property office regarding upcoming maintenance work affecting your unit." },
  { name: "Announcement", title: "Property Announcement", message: "" },
];

export default function Notifications() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<"EMAIL" | "IN_APP">("IN_APP");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DeliveryResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await notificationOperationsApi.recipients();
      setRecipients(rows);
      setSelected(current => current.filter(id => rows.some(row => row.id === id)));
    } catch (err) {
      setRecipients([]);
      setError(err instanceof Error ? err.message : "Unable to fetch tenants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => recipients.filter(r =>
    [r.name, r.email, r.unit, r.property].some(v =>
      v.toLowerCase().includes(search.trim().toLowerCase()))
  ), [recipients, search]);

  const allVisibleSelected = filtered.length > 0 && filtered.every(r => selected.includes(r.id));
  const toggle = (id: number) => setSelected(current =>
    current.includes(id) ? current.filter(v => v !== id) : current.length < 100 ? [...current, id] : current
  );
  const selectVisible = (checked: boolean) => {
    setSelected(current => checked
      ? Array.from(new Set([...current, ...filtered.map(r => r.id)])).slice(0, 100)
      : current.filter(id => !filtered.some(r => r.id === id)));
  };

  async function send() {
    setResult(null);
    if (!selected.length) { toast.error("Choose at least one tenant"); return; }
    if (!title.trim() || !message.trim()) { toast.error("Enter a subject and message"); return; }
    if (selected.length > 100 || title.length > 180 || message.length > 2000) {
      toast.error("Maximum 100 recipients, 180 subject characters and 2,000 message characters");
      return;
    }
    if (!window.confirm(channel === "EMAIL" ? `Submit ${selected.length} email(s) to the configured SMTP server?` : `Send ${selected.length} in-app notification(s) to tenant accounts?`)) return;
    setSending(true);
    try {
      const data = await notificationOperationsApi.send(selected, title.trim(), message.trim(), channel);
      setResult(data);
      if (data.failed) toast.error(`${data.accepted} accepted; ${data.failed} failed. Check notification logs.`);
      else toast.success(channel === "IN_APP" ? `${data.accepted} in-app notification(s) saved for recipients.` : `SMTP accepted ${data.accepted} email(s). Inbox delivery is not yet confirmed.`);
      setSelected([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send notifications");
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardLayout title="Notifications" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]}>
      <div className="space-y-6">
        <Card><CardContent className="p-5 flex gap-3 items-start">
          <Mail className="h-5 w-5 text-primary mt-1" />
          <div><p className="font-semibold">Email and in-app notifications</p>
            <p className="text-sm text-muted-foreground">Recipients come from approved property assignments in PostgreSQL. In-app messages are saved in PostgreSQL and appear in tenant notification bells. Email success means SMTP acceptance, not confirmed inbox delivery. SMS and WhatsApp require a provider.</p>
          </div>
        </CardContent></Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle>Select tenants ({selected.length}/100)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button></div></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative"><Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search tenant, property or unit" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <div className="flex items-center gap-2"><Checkbox id="select-visible" checked={allVisibleSelected}
                onCheckedChange={c => selectVisible(c === true)} />
                <Label htmlFor="select-visible">Select all matching tenants (up to 100)</Label></div>
              {loading && <p role="status">Loading tenants…</p>}
              {error && <p className="text-destructive" role="alert">{error}</p>}
              <div className="max-h-96 overflow-y-auto divide-y">
                {filtered.map(r => <label key={r.id} className="flex items-start gap-3 py-3 cursor-pointer">
                  <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggle(r.id)} />
                  <span><span className="block font-medium">{r.name}</span><span className="text-xs text-muted-foreground">{r.email}</span>
                    <span className="block text-xs text-muted-foreground">{r.property} — {r.unit}</span></span>
                </label>)}
                {!loading && !error && filtered.length === 0 && <p className="text-muted-foreground py-5">No matching tenants assigned to your properties.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Compose notification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Delivery channel</Label>
                <div className="flex gap-2">
                  <Button variant={channel === "IN_APP" ? "default" : "outline"} onClick={() => setChannel("IN_APP")}>In-app</Button>
                  <Button variant={channel === "EMAIL" ? "default" : "outline"} onClick={() => setChannel("EMAIL")}>Email</Button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">{presets.map(p => <Button key={p.name} size="sm" variant="outline" onClick={() => {setTitle(p.title);setMessage(p.message);}}>
                {p.name}</Button>)}</div>
              <div className="space-y-2"><Label htmlFor="mail-title">Subject</Label>
                <Input id="mail-title" maxLength={180} value={title} onChange={e => setTitle(e.target.value)} placeholder="Email subject" /></div>
              <div className="space-y-2"><Label htmlFor="mail-body">Message</Label>
                <Textarea id="mail-body" rows={8} maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your email message" />
                <p className="text-xs text-muted-foreground">{message.length}/2000 characters</p></div>
              <Button className="w-full" onClick={() => void send()} disabled={sending || loading || !!error || !selected.length || !title.trim() || !message.trim()}>
                <Send className="h-4 w-4 mr-2" />{sending ? "Sending…" : `Send ${channel === "IN_APP" ? "in-app" : "email"} to ${selected.length} tenant(s)`}</Button>
              {result && <div className="flex items-center gap-2 text-sm">
                {result.failed ? <AlertCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {result.accepted} {channel === "IN_APP" ? "saved in-app" : "accepted by SMTP"}; {result.failed} failed. See Notification Logs for recorded attempts.
              </div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
