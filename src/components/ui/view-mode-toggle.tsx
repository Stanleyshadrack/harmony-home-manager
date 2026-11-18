import { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ViewMode = 'grid' | 'list';

/** Persist display preference by section without affecting server-side filters or actions. */
export function useViewMode(key: string, initial: ViewMode = 'grid') {
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(`apartment:view:${key}`);
      return stored === 'list' || stored === 'grid' ? stored : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(`apartment:view:${key}`, view); } catch { /* storage may be unavailable */ }
  }, [key, view]);
  return [view, setView] as const;
}

export function ViewModeToggle({ value, onChange }: {
  value: ViewMode; onChange: (value: ViewMode) => void;
}) {
  return (
    <div role="group" aria-label="Display mode" className="inline-flex items-center gap-1 rounded-md border p-1">
      <Button size="sm" variant={value === 'list' ? 'default' : 'ghost'}
        aria-label="List view" aria-pressed={value === 'list'}
        onClick={() => onChange('list')} className="gap-2">
        <List className="h-4 w-4" /><span>List</span>
      </Button>
      <Button size="sm" variant={value === 'grid' ? 'default' : 'ghost'}
        aria-label="Grid view" aria-pressed={value === 'grid'}
        onClick={() => onChange('grid')} className="gap-2">
        <LayoutGrid className="h-4 w-4" /><span>Grid</span>
      </Button>
    </div>
  );
}
