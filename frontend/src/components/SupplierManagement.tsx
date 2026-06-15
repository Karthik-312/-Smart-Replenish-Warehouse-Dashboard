import { useCallback, useEffect, useState } from 'react';
import { Building2, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
  updateSupplier,
  type Supplier,
} from '../api/inventory';
import { useToast } from './Toast';

interface SupplierManagementProps {
  token: string;
  canEdit: boolean;
  canDelete: boolean;
}

export default function SupplierManagement({ token, canEdit, canDelete }: SupplierManagementProps) {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch {
      toast('Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const handleSave = async (data: Omit<Supplier, 'id'>) => {
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, data, token);
        toast('Supplier updated', 'success');
      } else {
        await createSupplier(data, token);
        toast('Supplier created', 'success');
      }
      setShowForm(false);
      setEditingSupplier(null);
      await loadSuppliers();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save supplier', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSupplier(id, token);
      toast('Supplier deleted', 'success');
      await loadSuppliers();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete supplier', 'error');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Suppliers</h2>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => { setEditingSupplier(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800">
          Loading suppliers...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-800">
          No suppliers yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{supplier.name}</h3>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setEditingSupplier(supplier); setShowForm(true); }}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(supplier.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {supplier.contactEmail && <p>{supplier.contactEmail}</p>}
                {supplier.phone && <p>{supplier.phone}</p>}
                {supplier.address && <p className="text-xs">{supplier.address}</p>}
                {supplier.notes && (
                  <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">{supplier.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingSupplier(null); }}
        />
      )}
    </section>
  );
}

function SupplierForm({
  supplier,
  onSave,
  onClose,
}: {
  supplier: Supplier | null;
  onSave: (data: Omit<Supplier, 'id'>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(supplier?.name ?? '');
  const [contactEmail, setContactEmail] = useState(supplier?.contactEmail ?? '');
  const [phone, setPhone] = useState(supplier?.phone ?? '');
  const [address, setAddress] = useState(supplier?.address ?? '');
  const [notes, setNotes] = useState(supplier?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name, contactEmail, phone, address, notes });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {supplier ? 'Edit Supplier' : 'Add Supplier'}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
