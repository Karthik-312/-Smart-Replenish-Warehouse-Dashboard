import { useState } from 'react';
import { Layers, Minus, Plus } from 'lucide-react';

interface BulkUpdateModalProps {
  selectedCount: number;
  onApply: (delta: number) => Promise<void>;
  onClose: () => void;
}

export default function BulkUpdateModal({ selectedCount, onApply, onClose }: BulkUpdateModalProps) {
  const [delta, setDelta] = useState(0);
  const [applying, setApplying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delta === 0) return;
    setApplying(true);
    try {
      await onApply(delta);
      onClose();
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
            <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bulk Stock Update</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Stock Adjustment
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDelta((d) => d - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-rose-50 hover:text-rose-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-rose-900/30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                className="w-24 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setDelta((d) => d + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-emerald-900/30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {delta > 0
                ? `Will add ${delta} unit${delta > 1 ? 's' : ''} to each selected item`
                : delta < 0
                  ? `Will remove ${Math.abs(delta)} unit${Math.abs(delta) > 1 ? 's' : ''} from each selected item`
                  : 'Enter a positive or negative number'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applying || delta === 0}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply to All'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
