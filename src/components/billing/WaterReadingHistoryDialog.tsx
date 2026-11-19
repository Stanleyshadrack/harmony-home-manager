import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, ArrowDown, ArrowUp, History, Loader2, Minus } from 'lucide-react';
import { waterReadingsApi } from '@/api/service/water.readings.service';
import type { WaterReadingResponse } from '@/api/dto/water.readings.dto';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const numeric = (value: number) => Number(value).toLocaleString('en-KE', { maximumFractionDigits: 3 });
const cash = (value: number) => new Intl.NumberFormat('en-KE', {
  style: 'currency', currency: 'KES', maximumFractionDigits: 2,
}).format(value);
const dateLabel = (value: string) => {
  try { return format(parseISO(value), 'dd MMM yyyy'); } catch { return value; }
};

/** View-only meter history. All records come from the permission-scoped backend unit endpoint. */
export function WaterReadingHistoryDialog({
  reading, onClose,
}: {
  reading: WaterReadingResponse | null;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<WaterReadingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!reading) return;
    let cancelled = false;
    setLoading(true);
    setHistory([]);
    setError('');
    void waterReadingsApi.getByUnit(Number(reading.unitId)).then(rows => {
      if (!cancelled) setHistory(rows);
    }).catch(() => {
      if (!cancelled) setError('Could not load reading history. Check your connection and property access, then retry.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [reading?.unitId, reading?.id]);

  const sorted = useMemo(() => [...history].sort((a, b) =>
    a.readingDate.localeCompare(b.readingDate) || Number(a.id) - Number(b.id)), [history]);
  const current = sorted.find(r => String(r.id) === String(reading?.id)) ?? reading;
  const previous = current
    ? [...sorted].reverse().find(r =>
        r.status === 'APPROVED' &&
        r.meterId === current.meterId &&
        (r.readingDate < current.readingDate ||
         (r.readingDate === current.readingDate && Number(r.id) < Number(current.id))))
    : undefined;
  const delta = previous && current ? Number(current.consumption) - Number(previous.consumption) : null;
  const deltaAmount = previous && current ? Number(current.amount) - Number(previous.amount) : null;

  return (
    <Dialog open={!!reading} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Compare water reading history
          </DialogTitle>
          <DialogDescription>
            Unit {reading?.unitNumber} · {reading?.property || reading?.propertyName} ·
            Meter {reading?.meterId}. Readings are view-only and are not changed by comparison.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading earlier readings…
          </div>
        ) : error ? (
          <div role="alert" className="space-y-3 rounded-md border p-4 text-sm">
            <p>{error}</p>
            <Button variant="outline" onClick={() => {
              if (!reading) return;
              setLoading(true); setError('');
              void waterReadingsApi.getByUnit(Number(reading.unitId))
                .then(setHistory).catch(() => setError('Reading history could not be loaded.'))
                .finally(() => setLoading(false));
            }}>Try again</Button>
          </div>
        ) : current && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium text-muted-foreground">Selected reading · {dateLabel(current.readingDate)}</p>
                <p className="mt-1 text-lg font-semibold">{numeric(current.consumption)} m³</p>
                <p className="text-sm">{cash(Number(current.amount))}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Previous: {numeric(current.previousReading)} m³ · Current: {numeric(current.currentReading)} m³
                </p>
                <Badge variant="outline" className="mt-2">{current.status}</Badge>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {previous ? `Previous approved reading · ${dateLabel(previous.readingDate)}` : 'Previous approved reading'}
                </p>
                {previous ? (
                  <>
                    <p className="mt-1 text-lg font-semibold">{numeric(previous.consumption)} m³</p>
                    <p className="text-sm">{cash(Number(previous.amount))}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Previous: {numeric(previous.previousReading)} m³ · Current: {numeric(previous.currentReading)} m³
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No earlier approved reading was found for this same meter.
                  </p>
                )}
              </div>
            </div>
            {delta !== null && deltaAmount !== null && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                <span className="inline-flex items-center gap-1">
                  {delta > 0 ? <ArrowUp className="h-4 w-4 text-amber-600" /> :
                   delta < 0 ? <ArrowDown className="h-4 w-4 text-emerald-600" /> :
                   <Minus className="h-4 w-4" />}
                  <strong>Consumption change:</strong> {delta > 0 ? '+' : ''}{numeric(delta)} m³
                </span>
                <span><strong>Charge change:</strong> {deltaAmount > 0 ? '+' : ''}{cash(deltaAmount)}</span>
                {Number(current.ratePerUnit) !== Number(previous?.ratePerUnit) && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" /> Rates differ between readings
                  </span>
                )}
              </div>
            )}
            <div className="space-y-2">
              <h3 className="font-semibold">All unit readings ({sorted.length})</h3>
              <p className="text-xs text-muted-foreground">
                Dates are oldest to newest. Changes are compared with the prior approved reading of the same meter.
                A replacement meter has its own baseline. Pending and rejected readings remain visible for audit.
              </p>
              <div className="w-full overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Date</TableHead><TableHead>Meter</TableHead>
                    <TableHead className="text-right">Previous (m³)</TableHead>
                    <TableHead className="text-right">Current (m³)</TableHead>
                    <TableHead className="text-right">Consumption (m³)</TableHead>
                    <TableHead className="text-right">Rate (KES/m³)</TableHead>
                    <TableHead className="text-right">Total (KES)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{sorted.map(item => (
                    <TableRow key={item.id} className={String(item.id) === String(current.id) ? 'bg-primary/10' : ''}>
                      <TableCell className="whitespace-nowrap">{dateLabel(item.readingDate)}</TableCell>
                      <TableCell>{item.meterId}</TableCell>
                      <TableCell className="text-right">{numeric(item.previousReading)}</TableCell>
                      <TableCell className="text-right">{numeric(item.currentReading)}</TableCell>
                      <TableCell className="text-right">{numeric(item.consumption)}</TableCell>
                      <TableCell className="text-right">{numeric(item.ratePerUnit)}</TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">{cash(Number(item.amount))}</TableCell>
                      <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
