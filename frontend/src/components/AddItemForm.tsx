import { useState } from 'react';
import { PackagePlus, Plus } from 'lucide-react';

export interface NewItemInput {
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minThreshold: number;
}

interface AddItemFormProps {
  categories: string[];
  onSubmit: (item: NewItemInput) => Promise<void>;
  submitting: boolean;
}

const emptyForm: NewItemInput = {
  name: '',
  sku: '',
  category: '',
  currentStock: 0,
  minThreshold: 5,
};

export default function AddItemForm({ categories, onSubmit, submitting }: AddItemFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewItemInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) {
      setError('Name, SKU, and category are required.');
      return;
    }
    if (form.currentStock < 0 || form.minThreshold < 0) {
      setError('Stock values cannot be negative.');
      return;
    }

    try {
      await onSubmit({
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: form.category.trim(),
        currentStock: form.currentStock,
        minThreshold: form.minThreshold,
      });
      setForm(emptyForm);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
      >
        <div className="flex items-center gap-2">
          <PackagePlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add New Product</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          <Plus className={`h-4 w-4 transition ${open ? 'rotate-45' : ''}`} />
          {open ? 'Close' : 'Open form'}
        </span>
      </button>

      {open && (
        <form onSubmit={(e) => void handleSubmit(e)} className="border-t border-slate-100 px-5 py-5 dark:border-slate-700">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Product name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Wireless Headphones"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">SKU</span>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="WH-009"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-slate-900 uppercase outline-none ring-indigo-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Category</span>
              <input
                type="text"
                list="category-suggestions"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Electronics"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
              />
              <datalist id="category-suggestions">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Current stock</span>
              <input
                type="number"
                min={0}
                value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Min threshold</span>
              <input
                type="number"
                min={0}
                value={form.minThreshold}
                onChange={(e) => setForm({ ...form, minThreshold: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <PackagePlus className="h-4 w-4" />
              {submitting ? 'Adding...' : 'Add product'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
