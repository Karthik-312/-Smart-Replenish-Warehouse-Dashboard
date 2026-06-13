import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, LogIn, LogOut, Zap } from 'lucide-react';
import {
  adjustStock,
  createItem,
  fetchInventory,
  fetchSummary,
  logout,
  type AuthUser,
  type InventoryItem,
  type InventorySummary,
} from './api/inventory';
import AddItemForm from './components/AddItemForm';
import InventoryFilters, { type InventoryFilterState } from './components/InventoryFilters';
import InventoryTable from './components/InventoryTable';
import LoginModal from './components/LoginModal';
import LowStockBanner from './components/LowStockBanner';
import StatusOverview, { RefreshButton } from './components/StatusOverview';
import { filterInventory, uniqueCategories } from './utils/filterInventory';

const emptySummary: InventorySummary = {
  totalItems: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
};

const defaultFilters: InventoryFilterState = {
  search: '',
  category: 'ALL',
  status: 'ALL',
};

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilterState>(defaultFilters);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const isLoggedIn = user !== null;

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

  const categories = useMemo(() => uniqueCategories(items), [items]);
  const filteredItems = useMemo(() => filterInventory(items, filters), [items, filters]);
  const alertItems = useMemo(
    () => items.filter((item) => item.status === 'LOW' || item.status === 'OUT_OF_STOCK'),
    [items],
  );

  const handleAdjust = async (id: number, delta: number) => {
    if (!user) return;
    setAdjustingId(id);
    setError(null);
    try {
      await adjustStock(id, delta, user.token);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setAdjustingId(null);
    }
  };

  const handleCreate = async (item: Omit<InventoryItem, 'id' | 'status'>) => {
    if (!user) return;
    setCreating(true);
    setError(null);
    try {
      await createItem(item, user.token);
      await loadData();
    } finally {
      setCreating(false);
    }
  };

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    if (user) {
      await logout(user.token).catch(() => {});
    }
    setUser(null);
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
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 ring-1 ring-inset ring-emerald-200">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt=""
                      className="h-6 w-6 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="text-xs font-semibold text-emerald-700">
                    {user.name || user.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700"
              >
                <LogIn className="h-4 w-4" />
                Login to Edit
              </button>
            )}
            <RefreshButton onClick={() => void loadData()} loading={loading} />
          </div>
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

        {!loading && <LowStockBanner items={alertItems} />}

        <StatusOverview summary={summary} loading={loading} />

        {isLoggedIn && (
          <AddItemForm categories={categories} onSubmit={handleCreate} submitting={creating} />
        )}

        <InventoryFilters
          filters={filters}
          categories={categories}
          onChange={setFilters}
          resultCount={filteredItems.length}
          totalCount={items.length}
        />

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
            <InventoryTable
              items={filteredItems}
              onAdjust={handleAdjust}
              adjustingId={adjustingId}
              readonly={!isLoggedIn}
              hasFilters={
                filters.search !== '' || filters.category !== 'ALL' || filters.status !== 'ALL'
              }
            />
          )}
        </section>
      </main>

      {showLogin && (
        <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}
