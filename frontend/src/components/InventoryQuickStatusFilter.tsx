import type { StatusFilter } from './InventoryFilters';

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All products' },
  { value: 'HEALTHY', label: 'Healthy' },
  { value: 'LOW', label: 'Low stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
];

interface InventoryQuickStatusFilterProps {
  value: StatusFilter;
  onChange: (status: StatusFilter) => void;
}

export default function InventoryQuickStatusFilter({ value, onChange }: InventoryQuickStatusFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-600 dark:bg-slate-800/80">
      <span className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Show
      </span>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-indigo-50 hover:ring-indigo-300 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-indigo-900/40'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
