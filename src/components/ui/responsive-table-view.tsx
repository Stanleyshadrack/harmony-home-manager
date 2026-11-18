import { useEffect, useRef, type ReactNode } from 'react';
import type { ViewMode } from '@/components/ui/view-mode-toggle';
import './responsive-table-view.css';

/** Turns each table row into a labelled card in grid mode.
 * List mode preserves the original accessible table structure and all row actions.
 */
export function ResponsiveTableView({ mode, children }: { mode: ViewMode; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const tables = node.querySelectorAll('table');
    tables.forEach(table => {
      const headings = Array.from(table.querySelectorAll('thead th'))
        .map(th => th.textContent?.trim() || 'Actions');
      table.querySelectorAll('tbody tr').forEach(row => {
        Array.from(row.querySelectorAll('td')).forEach((cell, index) => {
          cell.setAttribute('data-column-label', headings[index] || 'Details');
        });
      });
    });
  }, [mode, children]);

  return <div ref={root} className={mode === 'grid' ? 'responsive-table-grid' : 'responsive-table-list'}>{children}</div>;
}
