import { useCallback, useEffect, useState } from 'react';
import { Building2, MapPin, Plus, Star, Trash2, Edit2 } from 'lucide-react';
import {
  createWarehouse,
  deleteWarehouse,
  fetchWarehouses,
  updateWarehouse,
  type Warehouse,
} from '../api/inventory';
import { useToast } from './Toast';

interface Props {
  token: string;
  canEdit: boolean;
  canDelete: boolean;
}

export default function WarehouseManagement({ token, canEdit, canDelete }: Props) {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: '', location: '', default: false });

  const load = useCallback(async () => {
    try {
      setWarehouses(await fetchWarehouses());
    } catch {
      toast('Failed to load warehouses', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateWarehouse(editing.id, form, token);
        toast('Warehouse updated', 'success');
      } else {
        await createWarehouse(form, token);
        toast('Warehouse created', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', location: '', default: false });
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save warehouse', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWarehouse(id, token);
      toast('Warehouse deleted', 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete warehouse', 'error');
    }
  };

  const startEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({ name: w.name, location: w.location, default: w.default });
    setShowForm(true);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Warehouses</h2>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => { setEditing(null); setForm({ name: '', location: '', default: false }); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700"
          >
            <Plus className="h-4 w-4" />
            Add Warehouse
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Warehouse name"
              required
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Location"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.default}
              onChange={(e) => setForm({ ...form, default: e.target.checked })}
              className="rounded"
            />
            Default warehouse
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              {editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-600 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading warehouses...</p>
      ) : warehouses.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No warehouses configured.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <div key={w.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">{w.name}</h3>
                    {w.default && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                  </div>
                  {w.location && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3 w-3" /> {w.location}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {canEdit && (
                    <button type="button" onClick={() => startEdit(w)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && !w.default && (
                    <button type="button" onClick={() => void handleDelete(w.id)} className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
