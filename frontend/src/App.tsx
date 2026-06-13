import { useCallback, useEffect, useState } from 'react';
import { Boxes, Zap } from 'lucide-react';
import {
  adjustStock,
  fetchInventory,
  fetchSummary,
  type InventoryItem,
  type InventorySummary,
} from './api/inventory';
import InventoryTable from './components/InventoryTable';
import StatusOverview, { RefreshButton } from './components/StatusOverview';

const emptySummary: InventorySummary = {
  totalItems: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
};

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inventory, overview] = await Promise.all([fetchInventory(), fetchSummary()]);
      setItems(inventory);
      setSummary(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAdjust = async (id: number, delta: number) => {
    setAdjustingId(id);
    setError(null);
    try {
      await adjustStock(id, delta);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setAdjustingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 shadow-lg shadow-indigo-200">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">StockPulse</h1>
              <p className="text-sm text-slate-500">Inventory Replenishment System</p>
            </div>
          </div>
          <RefreshButton onClick={() => void loadData()} loading={loading} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
            <span className="mt-1 block text-xs text-rose-500">
              Make sure the backend is running on port 8080.
            </span>
          </div>
        )}

        <StatusOverview summary={summary} loading={loading} />

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Boxes className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Inventory List</h2>
          </div>
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Loading inventory...
            </div>
          ) : (
            <InventoryTable items={items} onAdjust={handleAdjust} adjustingId={adjustingId} />
          )}
        </section>
      </main>
    </div>
  );
}
