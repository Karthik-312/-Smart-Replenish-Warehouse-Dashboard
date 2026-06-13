import { AlertTriangle, Minus, Plus } from 'lucide-react';
import type { InventoryItem, StockStatus } from '../api/inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  onAdjust: (id: number, delta: number) => Promise<void>;
  adjustingId: number | null;
  hasFilters?: boolean;
  readonly?: boolean;
}

const statusStyles: Record<
  StockStatus,
  { label: string; badge: string; row: string }
> = {
  HEALTHY: {
    label: 'Healthy',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    row: 'bg-white',
  },
  LOW: {
    label: 'Low',
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    row: 'bg-amber-50/80',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    badge: 'bg-rose-100 text-rose-800 ring-rose-200',
    row: 'bg-rose-50/80',
  },
};

export default function InventoryTable({
  items,
  onAdjust,
  adjustingId,
  hasFilters = false,
  readonly = false,
}: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
        {hasFilters
          ? 'No items match your search or filters. Try clearing filters.'
          : 'No inventory items found.'}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Product', 'SKU', 'Category', 'Stock', 'Min Threshold', 'Status', ...(readonly ? [] : ['Quick Update'])].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const styles = statusStyles[item.status];
              const isAdjusting = adjustingId === item.id;

              return (
                <tr key={item.id} className={`transition-colors ${styles.row}`}>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center gap-2">
                      {(item.status === 'LOW' || item.status === 'OUT_OF_STOCK') && (
                        <AlertTriangle
                          className={`h-4 w-4 shrink-0 ${
                            item.status === 'OUT_OF_STOCK'
                              ? 'animate-pulse-warning text-rose-500'
                              : 'animate-pulse-warning text-amber-500'
                          }`}
                        />
                      )}
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-slate-600">
                    {item.sku}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                    {item.category}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">
                    {item.currentStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                    {item.minThreshold}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
                    >
                      {styles.label}
                    </span>
                  </td>
                  {!readonly && (
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isAdjusting || item.currentStock <= 0}
                          onClick={() => onAdjust(item.id, -1)}
                          title="Simulate sale"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                          Sale
                        </button>
                        <button
                          type="button"
                          disabled={isAdjusting}
                          onClick={() => onAdjust(item.id, 1)}
                          title="Simulate intake"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Intake
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
