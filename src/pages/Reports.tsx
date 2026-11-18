import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { ResponsiveTableView } from '@/components/ui/responsive-table-view';
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Download, RefreshCw, Building2, Users, Wrench, DollarSign } from "lucide-react";
import { apiRequest } from "@/api/https";
import { toast } from "sonner";

type MonthSummary = {
  month: string;
  collected: number;
  invoiced: number;
  maintenanceCost: number;
  payments: number;
};
type PropertySummary = {
  id: number;
  name: string;
  units: number;
  occupied: number;
  collected: number;
  outstanding: number;
};
type ReportSummary = {
  period: string;
  from: string;
  to: string;
  currency: string;
  collected: number;
  invoiced: number;
  outstanding: number;
  maintenanceCost: number;
  units: number;
  occupiedUnits: number;
  activeTenants: number;
  maintenanceResolved: number;
  maintenanceByCategory: Record<string, number>;
  maintenanceByStatus: Record<string, number>;
  monthly: MonthSummary[];
  properties: PropertySummary[];
};

const money = (n: number) => new Intl.NumberFormat("en-KE", {
  style: "currency", currency: "KES", maximumFractionDigits: 2,
}).format(n);

function csvCell(value: string | number) {
  const raw = String(value ?? "");
  // Prevent spreadsheet formula injection for exported untrusted names.
  const safe = /^[=+@\-\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export default function Reports() {
  const [viewMode, setViewMode] = useViewMode('reports', 'list');
  const { t } = useTranslation();
  const [period, setPeriod] = useState("year");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiRequest<null, ReportSummary>({
      path: "/api/reports/summary?period=" + encodeURIComponent(period),
      method: "GET",
    }).then(data => {
      if (active) setSummary(data);
    }).catch(err => {
      if (active) { setSummary(null); setError(err instanceof Error ? err.message : "Unable to load reports"); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  function exportReport() {
    if (!summary) return;
    const rows: (string | number)[][] = [
      ["Report", "From", "To", "Collected KES", "Invoiced KES", "Outstanding KES", "Maintenance Cost KES"],
      [summary.period, summary.from, summary.to, summary.collected, summary.invoiced, summary.outstanding, summary.maintenanceCost],
      [],
      ["Property", "Units", "Occupied Units", "Collected KES", "Outstanding KES"],
      ...summary.properties.map(p => [p.name, p.units, p.occupied, p.collected, p.outstanding]),
      [],
      ["Month", "Collected KES", "Invoiced KES", "Maintenance Cost KES", "Successful Payments"],
      ...summary.monthly.map(m => [m.month, m.collected, m.invoiced, m.maintenanceCost, m.payments]),
    ];
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `reports-${summary.from}-to-${summary.to}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Current report exported");
  }

  const cards = summary ? [
    { label: "Collected payments", value: money(summary.collected), icon: DollarSign },
    { label: "Occupancy rate", value: summary.units ? (100 * summary.occupiedUnits / summary.units).toFixed(1) + "%" : "N/A", icon: Building2 },
    { label: "Active tenants", value: String(summary.activeTenants), icon: Users },
    { label: "Maintenance resolved", value: String(summary.maintenanceResolved), icon: Wrench },
  ] : [];

  return (
    <DashboardLayout title={t("reports.title")} breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground">Actual records from your assigned properties. Amounts shown in KES.</p>
            {summary && <p className="text-sm text-muted-foreground">Period: {summary.from} to {summary.to}; outstanding is the current balance as of today.</p>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportReport} disabled={!summary || loading}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {loading && <p role="status">Loading reports from the backend…</p>}
        {error && <Card><CardContent className="p-6 text-destructive" role="alert">Could not load reports: {error}</CardContent></Card>}
        {summary && !loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map(card => <Card key={card.label}><CardContent className="p-5">
                <card.icon className="h-5 w-5 text-muted-foreground mb-3" />
                <p className="text-2xl font-semibold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </CardContent></Card>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Invoices raised this period</p><p className="text-xl font-semibold">{money(summary.invoiced)}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Currently outstanding (all dates)</p><p className="text-xl font-semibold">{money(summary.outstanding)}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Recorded maintenance actual cost</p><p className="text-xl font-semibold">{money(summary.maintenanceCost)}</p></CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Billing, collections and maintenance</CardTitle></CardHeader>
              <CardContent>
                {summary.monthly.length ? <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" /><YAxis tickFormatter={v => (v / 1000).toFixed(0) + "k"} />
                      <Tooltip formatter={(v: number) => money(v)} />
                      <Legend />
                      <Bar name="Collected" dataKey="collected" fill="#14b8a6" />
                      <Bar name="Invoiced" dataKey="invoiced" fill="#6366f1" />
                      <Bar name="Maintenance cost" dataKey="maintenanceCost" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                </div> : <p>No financial records for this period.</p>}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {([
                ["Maintenance by category", summary.maintenanceByCategory],
                ["Maintenance by status", summary.maintenanceByStatus],
              ] as const).map(([heading, values]) => (
                <Card key={heading}><CardHeader><CardTitle>{heading}</CardTitle></CardHeader>
                  <CardContent>{Object.keys(values).length ? Object.entries(values).map(([name, count]) =>
                    <div key={name} className="flex justify-between py-2 border-b last:border-0"><span>{name}</span><strong>{count}</strong></div>)
                    : <p className="text-muted-foreground">No maintenance records in the selected period.</p>}</CardContent>
                </Card>
              ))}
            </div>

            <Card><CardHeader><CardTitle>Property performance</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="flex justify-end mb-3"><ViewModeToggle value={viewMode} onChange={setViewMode} /></div>
              <ResponsiveTableView mode={viewMode}>
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left"><th className="py-3">Property</th><th>Units</th><th>Occupied</th><th>Collected</th><th>Outstanding</th></tr></thead>
                  <tbody>{summary.properties.map(p => <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{p.name}</td><td>{p.units}</td><td>{p.occupied}</td>
                    <td>{money(p.collected)}</td><td>{money(p.outstanding)}</td></tr>)}</tbody>
                </table>
                </ResponsiveTableView>
                {!summary.properties.length && <p className="py-5 text-muted-foreground">No properties assigned.</p>}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
