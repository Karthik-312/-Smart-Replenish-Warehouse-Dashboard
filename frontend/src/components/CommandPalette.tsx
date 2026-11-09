import { useEffect, useMemo, useState } from 'react';
import { Command, Search } from 'lucide-react';
import type { InventoryItem } from '../api/inventory';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface CommandPaletteProps {
  open: boolean;
  items: InventoryItem[];
  onClose: () => void;
  onSelectItem: (item: InventoryItem) => void;
  onFilterBySku: (sku: string) => void;
}

export default function CommandPalette({
  open,
  items,
  onClose,
  onSelectItem,
  onFilterBySku,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEscapeKey(open, onClose);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [items, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <Command className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU, category… (Ctrl+K)"
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline dark:border-slate-600">
            esc
          </kbd>
        </div>
        <ul className="max-h-[min(50vh,360px)] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No matches
            </li>
          ) : (
            results.map((item) => (
              <li key={item.id} className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                  className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700/80"
                >
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                    <span className="ml-2 font-mono text-xs text-slate-500">{item.sku}</span>
                  </span>
                  <span className="text-xs text-slate-400">{item.currentStock} in stock</span>
                </button>
                <button
                  type="button"
                  title="Filter table by SKU"
                  onClick={() => {
                    onFilterBySku(item.sku);
                    onClose();
                  }}
                  className="shrink-0 rounded-lg px-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                >
                  Filter
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
      <button type="button" className="fixed inset-0 -z-10" aria-label="Close" onClick={onClose} />
    </div>
  );
}
