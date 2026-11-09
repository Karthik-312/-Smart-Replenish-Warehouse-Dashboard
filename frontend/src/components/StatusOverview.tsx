import {
  Activity,
  AlertTriangle,
  Package,
  PackageX,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';
import type { InventorySummary } from '../api/inventory';
import type { StatusFilter } from './InventoryFilters';

interface StatusOverviewProps {
  summary: InventorySummary;
  loading: boolean;
  activeStatus?: StatusFilter;
  onFilterByStatus?: (status: 'LOW' | 'OUT_OF_STOCK') => void;
}

const cards = [
  {
    key: 'total' as const,
    label: 'Total Items',
    icon: Package,
    accent: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    key: 'lowStockItems' as const,
    label: 'Low Stock Items',
    icon: TrendingDown,
    accent: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  {
    key: 'outOfStockItems' as const,
    label: 'Out of Stock',
    icon: PackageX,
    accent: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
  },
];

export default function StatusOverview({
  summary,
  loading,
  activeStatus = 'ALL',
  onFilterByStatus,
}: StatusOverviewProps) {
  const summaryKey = (key: (typeof cards)[number]['key']) =>
    key === 'total' ? 'totalItems' : key;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Status Overview</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ key, label, icon: Icon, accent, bg, text }) => {
          const filterStatus =
            key === 'lowStockItems' ? 'LOW' : key === 'outOfStockItems' ? 'OUT_OF_STOCK' : null;
          const isFilterCard = filterStatus !== null;
          const isActive = isFilterCard && activeStatus === filterStatus;
          const Wrapper = isFilterCard && onFilterByStatus ? 'button' : 'article';
          const wrapperProps =
            isFilterCard && onFilterByStatus
              ? {
                  type: 'button' as const,
                  onClick: () => onFilterByStatus(filterStatus),
                  title:
                    isActive
                      ? 'Clear status filter'
                      : `Show ${label.toLowerCase()} in inventory list`,
                }
              : {};

          return (
            <Wrapper
              key={key}
              {...wrapperProps}
              className={`relative w-full overflow-hidden rounded-2xl border bg-white p-4 text-left sm:p-5 shadow-sm transition dark:bg-slate-800 ${
                isFilterCard && onFilterByStatus
                  ? 'cursor-pointer hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
                  : 'hover:shadow-md'
              } ${
                isActive
                  ? 'border-indigo-400 ring-2 ring-indigo-400/60 dark:border-indigo-500 dark:ring-indigo-500/50'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                  {loading ? (
                    <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-600" />
                  ) : (
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {summary[summaryKey(key)]}
                    </p>
                  )}
                </div>
                <div className={`shrink-0 rounded-xl p-3 ${bg} dark:bg-opacity-20`}>
                  <Icon className={`h-6 w-6 ${text}`} />
                </div>
              </div>
              {key === 'lowStockItems' && !loading && summary.lowStockItems > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 animate-pulse-warning" />
                  {isActive ? 'Filtering inventory list' : 'Click to filter inventory list'}
                </p>
              )}
              {key === 'outOfStockItems' && !loading && summary.outOfStockItems > 0 && isFilterCard && (
                <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {isActive ? 'Filtering inventory list' : 'Click to filter inventory list'}
                </p>
              )}
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}

export function RefreshButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:px-4 sm:py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );
}
