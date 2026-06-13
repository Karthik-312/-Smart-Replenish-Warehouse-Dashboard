import {
  Activity,
  AlertTriangle,
  Package,
  PackageX,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';
import type { InventorySummary } from '../api/inventory';

interface StatusOverviewProps {
  summary: InventorySummary;
  loading: boolean;
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

export default function StatusOverview({ summary, loading }: StatusOverviewProps) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-slate-800">Status Overview</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ key, label, icon: Icon, accent, bg, text }) => (
          <article
            key={key}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? '—' : summary[key === 'total' ? 'totalItems' : key]}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${bg}`}>
                <Icon className={`h-6 w-6 ${text}`} />
              </div>
            </div>
            {key === 'lowStockItems' && !loading && summary.lowStockItems > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5 animate-pulse-warning" />
                Reorder alerts may be active
              </p>
            )}
          </article>
        ))}
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
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  );
}
