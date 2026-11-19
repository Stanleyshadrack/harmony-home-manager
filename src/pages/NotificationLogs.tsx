import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { ResponsiveTableView } from '@/components/ui/responsive-table-view';
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Download, Search, Mail, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { notificationOperationsApi, DeliveryHistory } from "@/api/service/notificationOperationsApi";
import { toast } from "sonner";

function safeCsv(value: string | number | null | undefined) {
  const s = String(value ?? "");
  const guarded = /^[=+@\-\t\r]/.test(s) ? "'" + s : s;
  return '"' + guarded.replace(/"/g, '""') + '"';
}

export default function NotificationLogs() {
  const [viewMode, setViewMode] = useViewMode('notificationlogs', 'list');
  const [logs, setLogs] = useState<DeliveryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const response = await notificationOperationsApi.history();
      setLogs(response);
    } catch (err) {
      setLogs([]);
      setError(err instanceof Error ? err.message : "Could not load notification logs");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, []);
  const filtered = useMemo(() => logs.filter(n => {
    const needle = search.trim().toLowerCase();
    return (!needle || [n.recipient, n.message, n.title || "", n.type || ""].some(t =>
      t.toLowerCase().includes(needle)))
      && (status === "all" || n.status === status)
      && (channel === "all" || (n.channel || "").toUpperCase() === channel);
  }), [logs, search, status, channel]);

  const stats = {
    total: logs.length,
    accepted: logs.filter(n => n.status === "accepted").length,
    failed: logs.filter(n => n.status === "failed").length,
    recorded: logs.filter(n => n.status === "recorded" || n.status === "in_app").length,
  };

  function exportCsv() {
    const rows: (string | number | undefined | null)[][] = [
      ["Timestamp", "Channel", "Type", "Recipient", "Subject", "Message", "Status"],
      ...filtered.map(n => [n.timestamp, n.channel, n.type, n.recipient, n.title, n.message, n.status]),
    ];
    const blob = new Blob(["\uFEFF", rows.map(row => row.map(safeCsv).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "notification-logs-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click(); URL.revokeObjectURL(url);
    toast.success("Visible notification logs exported");
  }

  return <DashboardLayout title="Notification Logs"
    breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notification Logs" }]}>
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Database-backed history of system emails and in-app notifications, including send failures.
        “SMTP accepted” means the mail server accepted the message, not that it reached the recipient's inbox.
        Sensitive OTP codes, email bodies and password links are not stored in the SMTP audit log.
        The latest 500 records are shown; older records remain in PostgreSQL.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          ["Recently logged", stats.total, Clock],
          ["SMTP accepted", stats.accepted, CheckCircle2],
          ["Submission failed", stats.failed, AlertTriangle],
          ["Other/legacy", stats.recorded, Mail],
        ] as const).map(([label, value, Icon]) => (
          <Card key={label}><CardContent className="p-5">
            <Icon className="h-5 w-5 text-muted-foreground mb-3" /><p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Email & notification history</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void refresh()} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
              <Button variant="outline" onClick={exportCsv} disabled={!filtered.length || loading}>
                <Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative"><Search className="h-4 w-4 absolute top-3 left-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search recipient, subject or message" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="accepted">SMTP accepted</SelectItem><SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="recorded">Legacy/unverified</SelectItem><SelectItem value="in_app">In-app</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All channels</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem><SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem><SelectItem value="IN_APP">In-app</SelectItem></SelectContent>
            </Select>
          </div>
          {loading && <p role="status">Loading notification history…</p>}
          {error && <p role="alert" className="text-destructive">{error}</p>}
          {!loading && !error && !filtered.length && <p className="py-8 text-center text-muted-foreground">No recorded notifications match your filters.</p>}
          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <div className="flex justify-end mb-3"><ViewModeToggle value={viewMode} onChange={setViewMode} /></div>
              <ResponsiveTableView mode={viewMode}>
                <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-3 pr-3">Date</th><th className="pr-3">Recipient</th>
                  <th className="pr-3">Channel</th><th className="pr-3">Type</th><th className="pr-3">Subject / message</th><th>Status</th></tr></thead>
                <tbody>{filtered.map(log => <tr key={log.id} className="border-b last:border-0">
                  <td className="py-3 pr-3 whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</td>
                  <td className="pr-3">{log.recipient}</td>
                  <td className="pr-3">{log.channel || "—"}</td>
                  <td className="pr-3 whitespace-nowrap text-muted-foreground">{log.type?.replace(/_/g, " ") || "—"}</td>
                  <td className="pr-3 max-w-xs"><strong>{log.title || "Notification"}</strong>
                    <p className="text-muted-foreground truncate" title={log.message}>{log.message}</p></td>
                  <td className="capitalize">{log.status === "accepted" ? "SMTP accepted" : log.status === "recorded" ? "Legacy / unverified" : log.status.replace("_", " ")}</td>
                </tr>)}</tbody>
              </table>
                </ResponsiveTableView>
            </div>
          )}
          {!loading && !error && <p className="text-xs text-muted-foreground">Showing up to 500 recent records. Export uses the current filtered rows.</p>}
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>;
}
