import { AlertTriangle, BarChart3, Clock, Minus, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import type { InventoryItem, StockStatus } from '../api/inventory';
import StockAdjustMenu from './StockAdjustMenu';

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
  highlightItemId?: number | null;
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

function StockLevelBar({ current, min, status }: { current: number; min: number; status: StockStatus }) {
  const target = Math.max(min, 1);
  const pct = Math.min(100, Math.round((current / target) * 100));
  const barColor =
    status === 'OUT_OF_STOCK'
      ? 'bg-rose-500'
      : status === 'LOW'
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div className="mt-1.5 w-full max-w-[120px]">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
        {current} / min {min}
      </p>
    </div>
  );
}

function ProductThumb({ item }: { item: InventoryItem }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-600"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
      <Package className="h-5 w-5 text-slate-400" />
    </div>
  );
}

function ItemActions({
  item,
  readonly,
  isAdjusting,
  canDelete,
  onAdjust,
  onEdit,
  onHistory,
  onForecast,
  onDelete,
}: {
  item: InventoryItem;
  readonly: boolean;
  isAdjusting: boolean;
  canDelete: boolean;
  onAdjust: (id: number, delta: number) => void;
  onEdit: (item: InventoryItem) => void;
  onHistory: (item: InventoryItem) => void;
  onForecast?: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={readonly || isAdjusting || item.currentStock <= 0}
        onClick={() => void onAdjust(item.id, -1)}
        title={readonly ? 'Login to enable' : 'Simulate sale'}
        className="action-icon-btn action-icon-btn--minus inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={readonly || isAdjusting}
        onClick={() => void onAdjust(item.id, 1)}
        title={readonly ? 'Login to enable' : 'Simulate intake'}
        className="action-icon-btn action-icon-btn--plus inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <StockAdjustMenu
        currentStock={item.currentStock}
        disabled={readonly || isAdjusting}
        onAdjust={(d) => void onAdjust(item.id, d)}
      />
      <button
        type="button"
        disabled={readonly}
        onClick={() => onEdit(item)}
        title={readonly ? 'Login to enable' : 'Edit item'}
        className="action-icon-btn action-icon-btn--edit inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onHistory(item)}
        title="View history"
        className="action-icon-btn action-icon-btn--history inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
      >
        <Clock className="h-3.5 w-3.5" />
      </button>
      {onForecast && (
        <button
          type="button"
          onClick={() => onForecast(item)}
          title="Demand forecast"
          className="action-icon-btn action-icon-btn--forecast inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          <BarChart3 className="h-3.5 w-3.5" />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(item)}
          title="Delete item"
          className="action-icon-btn action-icon-btn--delete inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

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
  highlightItemId,
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
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const rowHighlight = (id: number) =>
    highlightItemId === id ? 'ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500' : '';

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => {
          const styles = statusStyles[item.status];
          const isAdjusting = adjustingId === item.id;
          return (
            <article
              key={item.id}
              id={`inventory-row-${item.id}`}
              className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${styles.row} ${rowHighlight(item.id)}`}
            >
              <div className="flex gap-3">
                <ProductThumb item={item} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                      <p className="font-mono text-xs text-slate-500">{item.sku}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}>
                      {styles.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.category}</p>
                  <StockLevelBar current={item.currentStock} min={item.minThreshold} status={item.status} />
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
                <ItemActions
                  item={item}
                  readonly={readonly}
                  isAdjusting={isAdjusting}
                  canDelete={canDelete}
                  onAdjust={(id, d) => void onAdjust(id, d)}
                  onEdit={onEdit}
                  onHistory={onHistory}
                  onForecast={onForecast}
                  onDelete={onDelete}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 md:block">
        <div className="max-h-[min(70vh,640px)] overflow-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
              <tr>
                {!readonly && (
                  <th className="w-12 bg-slate-50 px-4 py-3 dark:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
                    />
                  </th>
                )}
                {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((header) => (
                  <th
                    key={header}
                    className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  >
                    {header}
                  </th>
                ))}
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
                    id={`inventory-row-${item.id}`}
                    className={`transition-colors ${styles.row} ${isSelected ? '!bg-indigo-50 dark:!bg-indigo-900/20' : ''} ${rowHighlight(item.id)}`}
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
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <ProductThumb item={item} />
                        <div>
                          <div className="flex items-center gap-1.5">
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
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">
                      {item.sku}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.category}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {item.finalPrice != null ? (
                        <span className="font-semibold">₹{item.finalPrice.toFixed(2)}</span>
                      ) : item.price != null ? (
                        <span>₹{item.price.toFixed(2)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.currentStock}</span>
                      <StockLevelBar current={item.currentStock} min={item.minThreshold} status={item.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}>
                        {styles.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <ItemActions
                        item={item}
                        readonly={readonly}
                        isAdjusting={isAdjusting}
                        canDelete={canDelete}
                        onAdjust={(id, d) => void onAdjust(id, d)}
                        onEdit={onEdit}
                        onHistory={onHistory}
                        onForecast={onForecast}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
