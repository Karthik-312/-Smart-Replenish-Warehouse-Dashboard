import { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface StockAdjustMenuProps {
  currentStock: number;
  disabled?: boolean;
  onAdjust: (delta: number) => void;
}

export default function StockAdjustMenu({ currentStock, disabled, onAdjust }: StockAdjustMenuProps) {
  const [open, setOpen] = useState(false);
  const [setValue, setSetValue] = useState(String(currentStock));

  useEffect(() => {
    setSetValue(String(currentStock));
  }, [currentStock]);

  if (disabled) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="action-icon-btn action-icon-btn--more inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
        title="More stock actions"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-600 dark:bg-slate-800">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400">Quick adjust</p>
            {([-5, -1, 1, 5] as const).map((d) => (
              <button
                key={d}
                type="button"
                disabled={d < 0 && currentStock + d < 0}
                onClick={() => {
                  onAdjust(d);
                  setOpen(false);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {d > 0 ? '+' : ''}
                {d} units
              </button>
            ))}
            <form
              className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-700"
              onSubmit={(e) => {
                e.preventDefault();
                const target = Number(setValue);
                if (Number.isNaN(target) || target < 0) return;
                const delta = target - currentStock;
                if (delta !== 0) onAdjust(delta);
                setOpen(false);
              }}
            >
              <label className="px-2 text-[10px] font-semibold uppercase text-slate-400">Set stock</label>
              <div className="mt-1 flex gap-1 px-1">
                <input
                  type="number"
                  min={0}
                  value={setValue}
                  onChange={(e) => setSetValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-2 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Set
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
