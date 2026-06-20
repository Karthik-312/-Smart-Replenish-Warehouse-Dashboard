import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, ArrowRight, Package, CheckCircle2, XCircle } from 'lucide-react';
import {
  fetchPurchaseOrders,
  updatePurchaseOrderStatus,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '../api/inventory';
import { useToast } from './Toast';

interface Props {
  token: string;
  canEdit: boolean;
}

const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ORDERED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  RECEIVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
};

const NEXT_STATUS: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus>> = {
  PENDING: 'APPROVED',
  APPROVED: 'ORDERED',
  ORDERED: 'RECEIVED',
};

const NEXT_LABEL: Partial<Record<PurchaseOrderStatus, string>> = {
  PENDING: 'Approve',
  APPROVED: 'Mark Ordered',
  ORDERED: 'Mark Received',
};

export default function PurchaseOrders({ token, canEdit }: Props) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PurchaseOrderStatus | ''>('');

  const load = useCallback(async () => {
    try {
      const data = await fetchPurchaseOrders(filter || undefined);
      setOrders(data);
    } catch {
      toast('Failed to load purchase orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, filter]);

  useEffect(() => { void load(); }, [load]);

  const handleAdvance = async (po: PurchaseOrder) => {
    const next = NEXT_STATUS[po.status];
    if (!next) return;
    try {
      await updatePurchaseOrderStatus(po.id, next, token);
      toast(`PO #${po.id} → ${next}`, 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update PO', 'error');
    }
  };

  const handleCancel = async (po: PurchaseOrder) => {
    try {
      await updatePurchaseOrderStatus(po.id, 'CANCELLED', token);
      toast(`PO #${po.id} cancelled`, 'info');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to cancel PO', 'error');
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Purchase Orders</h2>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {pendingCount} pending
            </span>
          )}
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as PurchaseOrderStatus | '')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="ORDERED">Ordered</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading purchase orders...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
          <Package className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No purchase orders found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                {canEdit && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id} className="border-b border-slate-50 last:border-0 dark:border-slate-700/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{po.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{po.itemName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{po.sku}</td>
                  <td className="px-4 py-3 font-semibold">{po.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[po.status]}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '—'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {NEXT_STATUS[po.status] && (
                          <button
                            type="button"
                            onClick={() => void handleAdvance(po)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                          >
                            {po.status === 'ORDERED' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <ArrowRight className="h-3 w-3" />
                            )}
                            {NEXT_LABEL[po.status]}
                          </button>
                        )}
                        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => void handleCancel(po)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                          >
                            <XCircle className="h-3 w-3" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
