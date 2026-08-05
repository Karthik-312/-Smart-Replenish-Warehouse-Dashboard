import { AlertTriangle, BarChart3, Clock, Lock, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import type { InventoryItem, StockStatus } from '../api/inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  onAdjust: (id: number, delta: number) => Promise<void>;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onHistory: (item: InventoryItem) => void;
  onForecast?: (item: InventoryItem) => void;
  adjustingId: number | null;
  hasFilters?: boolean;
  readonly?: boolean;
  canDelete?: boolean;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
}

const statusStyles: Record<
  StockStatus,
  { label: string; badge: string; row: string }
> = {
  HEALTHY: {
    label: 'Healthy',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700',
    row: 'bg-white dark:bg-slate-800',
  },
  LOW: {
    label: 'Low',
    badge: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700',
    row: 'bg-amber-50/80 dark:bg-amber-900/20',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    badge: 'bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-700',
    row: 'bg-rose-50/80 dark:bg-rose-900/20',
  },
};

export default function InventoryTable({
  items,
  onAdjust,
  onEdit,
  onDelete,
  onHistory,
  onForecast,
  adjustingId,
  hasFilters = false,
  readonly = false,
  canDelete = false,
  selectedIds,
  onSelectionChange,
}: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
        {hasFilters
          ? 'No items match your search or filters. Try clearing filters.'
          : 'No inventory items found.'}
      </div>
    );
  }

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected = items.some((item) => selectedIds.has(item.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map((item) => item.id)));
    }
  };

  const toggleItem = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/80">
            <tr>
              {!readonly && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
                  />
                </th>
              )}
              {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Min Threshold', 'Status', 'Actions'].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {items.map((item) => {
              const styles = statusStyles[item.status];
              const isAdjusting = adjustingId === item.id;
              const isSelected = selectedIds.has(item.id);

              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${styles.row} ${isSelected ? '!bg-indigo-50 dark:!bg-indigo-900/20' : ''}`}
                >
                  {!readonly && (
                    <td className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
                      />
                    </td>
                  )}
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
                      <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">
                    {item.sku}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {item.category}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.price != null ? `₹${item.price.toFixed(2)}` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.currentStock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {item.minThreshold}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
                    >
                      {styles.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={readonly || isAdjusting || item.currentStock <= 0}
                        onClick={() => onAdjust(item.id, -1)}
                        title={readonly ? 'Login to enable' : 'Simulate sale'}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={readonly || isAdjusting}
                        onClick={() => onAdjust(item.id, 1)}
                        title={readonly ? 'Login to enable' : 'Simulate intake'}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={readonly}
                        onClick={() => onEdit(item)}
                        title={readonly ? 'Login to enable' : 'Edit item'}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onHistory(item)}
                        title="View history"
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-300"
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </button>
                      {onForecast && (
                        <button
                          type="button"
                          onClick={() => onForecast(item)}
                          title="Demand forecast"
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-teal-700 dark:hover:bg-teal-900/30 dark:hover:text-teal-300"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          title="Delete item"
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {readonly && (
                        <span title="Login required">
                          <Lock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
