import { Filter, Search, X } from 'lucide-react';
import type { StockStatus } from '../api/inventory';

export type StatusFilter = StockStatus | 'ALL';

export interface InventoryFilterState {
  search: string;
  category: string;
  status: StatusFilter;
}

interface InventoryFiltersProps {
  filters: InventoryFilterState;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  categories: string[];
  onChange: (filters: InventoryFilterState) => void;
  resultCount: number;
  globalTotalItems: number;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'HEALTHY', label: 'Healthy' },
  { value: 'LOW', label: 'Low stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
];

const STATUS_CHIP_LABEL: Record<StockStatus, string> = {
  HEALTHY: 'Healthy',
  LOW: 'Low stock',
  OUT_OF_STOCK: 'Out of stock',
};

export default function InventoryFilters({
  filters,
  searchInput,
  onSearchInputChange,
  categories,
  onChange,
  resultCount,
  globalTotalItems,
}: InventoryFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' || filters.category !== 'ALL' || filters.status !== 'ALL';

  const removeChip = (key: 'search' | 'category' | 'status') => {
    if (key === 'search') {
      onSearchInputChange('');
      onChange({ ...filters, search: '' });
    } else if (key === 'category') {
      onChange({ ...filters, category: 'ALL' });
    } else {
      onChange({ ...filters, status: 'ALL' });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 sm:text-lg">Search &amp; Filter</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">{resultCount}</span> matching
          filters
          <span className="text-slate-400"> · </span>
          {globalTotalItems} in full catalog
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative block sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Search by name, SKU, or category..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
          />
        </label>

        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        >
          <option value="ALL">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as StatusFilter })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {filters.search && (
            <FilterChip label={`Search: “${filters.search}”`} onRemove={() => removeChip('search')} />
          )}
          {filters.category !== 'ALL' && (
            <FilterChip label={`Category: ${filters.category}`} onRemove={() => removeChip('category')} />
          )}
          {filters.status !== 'ALL' && (
            <FilterChip
              label={`Status: ${STATUS_CHIP_LABEL[filters.status]}`}
              onRemove={() => removeChip('status')}
            />
          )}
          <button
            type="button"
            onClick={() => {
              onSearchInputChange('');
              onChange({ search: '', category: 'ALL', status: 'ALL' });
            }}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pl-2.5 pr-1 text-xs font-medium text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:ring-indigo-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-800/50"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
