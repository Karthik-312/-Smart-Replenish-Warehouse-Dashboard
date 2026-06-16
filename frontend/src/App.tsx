import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, Download, Layers, LogIn, LogOut, Moon, ScanBarcode, Sun, Zap } from 'lucide-react';
import {
  adjustStock,
  bulkAdjustStock,
  createItem,
  deleteItem,
  fetchInventory,
  fetchInventoryPaged,
  fetchSummary,
  logout,
  updateItem,
  type AuthUser,
  type InventoryItem,
  type InventorySummary,
} from './api/inventory';
import AddItemForm from './components/AddItemForm';
import AuditLogPanel from './components/AuditLogPanel';
import BarcodeScanner from './components/BarcodeScanner';
import BulkUpdateModal from './components/BulkUpdateModal';
import DashboardCharts from './components/DashboardCharts';
import ConfirmDialog from './components/ConfirmDialog';
import EditItemModal from './components/EditItemModal';
import InventoryFilters, { type InventoryFilterState } from './components/InventoryFilters';
import InventoryTable from './components/InventoryTable';
import LoginModal from './components/LoginModal';
import LowStockBanner from './components/LowStockBanner';
import Pagination from './components/Pagination';
import StatusOverview, { RefreshButton } from './components/StatusOverview';
import SupplierManagement from './components/SupplierManagement';
import { ToastProvider, useToast } from './components/Toast';
import { exportToCsv } from './utils/exportCsv';
import { uniqueCategories } from './utils/filterInventory';

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

function AppContent() {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<InventoryFilterState>(defaultFilters);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('stockpulse-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  // Edit state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // History state
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: '', confirmVariant: 'danger', onConfirm: () => {} });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('stockpulse-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const isLoggedIn = user !== null;
  const canEdit = isLoggedIn && (user.role === 'ADMIN' || user.role === 'MANAGER');
  const canDelete = isLoggedIn && user.role === 'ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pagedResult, overview, all] = await Promise.all([
        fetchInventoryPaged(page, pageSize, filters.search, filters.category, filters.status),
        fetchSummary(),
        fetchInventory(),
      ]);
      setItems(pagedResult.content);
      setTotalPages(pagedResult.totalPages);
      setTotalElements(pagedResult.totalElements);
      setSummary(overview);
      setAllItems(all);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, page, filters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  const categories = useMemo(() => uniqueCategories(allItems), [allItems]);
  const alertItems = useMemo(
    () => allItems.filter((item) => item.status === 'LOW' || item.status === 'OUT_OF_STOCK'),
    [allItems],
  );

  const handleAdjust = async (id: number, delta: number) => {
    if (!user) return;
    setAdjustingId(id);
    try {
      await adjustStock(id, delta, user.token);
      await loadData();
      toast(delta > 0 ? 'Stock increased' : 'Stock decreased', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update stock', 'error');
    } finally {
      setAdjustingId(null);
    }
  };

  const handleCreate = async (item: Omit<InventoryItem, 'id' | 'status'>) => {
    if (!user) return;
    setCreating(true);
    try {
      await createItem(item, user.token);
      await loadData();
      toast('Item created successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create item', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (id: number, data: { name: string; sku: string; category: string; minThreshold: number }) => {
    if (!user) return;
    try {
      await updateItem(id, data, user.token);
      await loadData();
      toast('Item updated successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update item', 'error');
    }
  };

  const handleDeleteRequest = (item: InventoryItem) => {
    setConfirmState({
      open: true,
      title: 'Delete Item',
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        void handleDelete(item.id);
      },
    });
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    try {
      await deleteItem(id, user.token);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadData();
      toast('Item deleted successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete item', 'error');
    }
  };

  const handleBulkUpdate = async (delta: number) => {
    if (!user || selectedIds.size === 0) return;
    const absDelta = Math.abs(delta);
    const action = delta > 0 ? 'add' : 'remove';

    setConfirmState({
      open: true,
      title: 'Confirm Bulk Update',
      message: `Are you sure you want to ${action} ${absDelta} unit${absDelta > 1 ? 's' : ''} ${delta > 0 ? 'to' : 'from'} ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}?`,
      confirmLabel: 'Apply',
      confirmVariant: 'warning',
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        void executeBulkUpdate(delta);
      },
    });
  };

  const executeBulkUpdate = async (delta: number) => {
    if (!user) return;
    try {
      await bulkAdjustStock(Array.from(selectedIds), delta, user.token);
      await loadData();
      setSelectedIds(new Set());
      toast(`Stock updated for ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Bulk update failed', 'error');
    }
  };

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
    setShowLogin(false);
    toast(`Welcome, ${authUser.name || authUser.email}!`, 'success');
  };

  const handleLogout = async () => {
    if (user) {
      await logout(user.token).catch(() => {});
    }
    setUser(null);
    setSelectedIds(new Set());
    toast('Logged out successfully', 'info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">StockPulse</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Inventory Replenishment System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-700">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt=""
                      className="h-6 w-6 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {user.name || user.email}
                  </span>
                  <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title="Scan barcode/QR code"
            >
              <ScanBarcode className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <RefreshButton onClick={() => void loadData()} loading={loading} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {!loading && <LowStockBanner items={alertItems} />}

        <StatusOverview summary={summary} loading={loading} />

        {!loading && allItems.length > 0 && (
          <DashboardCharts items={allItems} summary={summary} />
        )}

        {canEdit && (
          <AddItemForm categories={categories} onSubmit={handleCreate} submitting={creating} />
        )}

        <InventoryFilters
          filters={filters}
          categories={categories}
          onChange={setFilters}
          resultCount={totalElements}
          totalCount={allItems.length}
        />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Inventory List</h2>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setShowBulkUpdate(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700"
                >
                  <Layers className="h-4 w-4" />
                  Bulk Update ({selectedIds.size})
                </button>
              )}
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => exportToCsv(allItems)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Loading inventory...
            </div>
          ) : (
            <>
              <InventoryTable
                items={items}
                onAdjust={handleAdjust}
                onEdit={(item) => setEditingItem(item)}
                onDelete={handleDeleteRequest}
                onHistory={(item) => setHistoryItem(item)}
                adjustingId={adjustingId}
                readonly={!canEdit}
                canDelete={canDelete}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                hasFilters={
                  filters.search !== '' || filters.category !== 'ALL' || filters.status !== 'ALL'
                }
              />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </section>

        {isLoggedIn && (
          <SupplierManagement token={user.token} canEdit={canEdit} canDelete={canDelete} />
        )}
      </main>

      {showLogin && (
        <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          categories={categories}
          onSave={handleEdit}
          onClose={() => setEditingItem(null)}
        />
      )}

      {showBulkUpdate && (
        <BulkUpdateModal
          selectedCount={selectedIds.size}
          onApply={handleBulkUpdate}
          onClose={() => setShowBulkUpdate(false)}
        />
      )}

      {historyItem && (
        <AuditLogPanel item={historyItem} onClose={() => setHistoryItem(null)} />
      )}

      {showScanner && (
        <BarcodeScanner
          items={allItems}
          onFound={(item) => {
            setShowScanner(false);
            setEditingItem(item);
            toast(`Found: ${item.name} (${item.sku})`, 'success');
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        confirmVariant={confirmState.confirmVariant}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
