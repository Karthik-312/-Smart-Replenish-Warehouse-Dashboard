import { Filter, Search } from 'lucide-react';
import type { StockStatus } from '../api/inventory';

export type StatusFilter = StockStatus | 'ALL';

export interface InventoryFilterState {
  search: string;
  category: string;
  status: StatusFilter;
}

interface InventoryFiltersProps {
  filters: InventoryFilterState;
  categories: string[];
  onChange: (filters: InventoryFilterState) => void;
  resultCount: number;
  totalCount: number;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'HEALTHY', label: 'Healthy' },
  { value: 'LOW', label: 'Low stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
];

export default function InventoryFilters({
  filters,
  categories,
  onChange,
  resultCount,
  totalCount,
}: InventoryFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' || filters.category !== 'ALL' || filters.status !== 'ALL';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Search &amp; Filter</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing {resultCount} of {totalCount} items
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative block sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
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
        <button
          type="button"
          onClick={() => onChange({ search: '', category: 'ALL', status: 'ALL' })}
          className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
