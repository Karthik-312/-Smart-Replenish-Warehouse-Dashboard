import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Download, Layers, LogIn, LogOut, Moon, ScanBarcode, Sun, Zap } from 'lucide-react';
import {
  adjustStock,
  bulkAdjustStock,
  createItem,
  deleteItem,
  fetchInventory,
  fetchInventoryMatchingFilters,
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
import ForecastPanel from './components/ForecastPanel';
import InventoryFilters, { type InventoryFilterState } from './components/InventoryFilters';
import InventoryTable from './components/InventoryTable';
import LoginModal from './components/LoginModal';
import PurchaseOrders from './components/PurchaseOrders';
import LowStockBanner from './components/LowStockBanner';
import Pagination from './components/Pagination';
import StatusOverview, { RefreshButton } from './components/StatusOverview';
import SectionNav, { type SectionId } from './components/SectionNav';
import CommandPalette from './components/CommandPalette';
import InventoryTableSkeleton from './components/InventoryTableSkeleton';
import LoadErrorBanner from './components/LoadErrorBanner';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { clearAuth, loadAuth, saveAuth } from './utils/authStorage';
import SupplierManagement from './components/SupplierManagement';
import WarehouseManagement from './components/WarehouseManagement';
import { ToastProvider, useToast } from './components/Toast';
import { useWebSocket } from './hooks/useWebSocket';
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
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [user, setUser] = useState<AuthUser | null>(() => loadAuth());
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const hasBootstrappedRef = useRef(false);
  const [tableRefreshing, setTableRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [highlightItemId, setHighlightItemId] = useState<number | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);
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

  // Forecast state
  const [forecastItem, setForecastItem] = useState<InventoryItem | null>(null);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);

  const inventorySectionRef = useRef<HTMLElement>(null);
  const [alertBannerSnoozed, setAlertBannerSnoozed] = useState(false);
  const [alertBannerDismissed, setAlertBannerDismissed] = useState(
    () => sessionStorage.getItem('stockpulse-alert-banner-dismissed') === '1',
  );

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

  useEffect(() => {
    setFilters((prev) => (prev.search === debouncedSearch ? prev : { ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const loadData = useCallback(async () => {
    setLoadError(null);
    if (!hasBootstrappedRef.current) setLoading(true);
    else setTableRefreshing(true);
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
      setLastUpdatedAt(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory';
      setLoadError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
      setTableRefreshing(false);
      hasBootstrappedRef.current = true;
      setHasBootstrapped(true);
    }
  }, [toast, page, filters]);

  const { connected: wsConnected } = useWebSocket(loadData);

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

  const showAlertBanner =
    !loading && alertItems.length > 0 && !alertBannerSnoozed && !alertBannerDismissed;

  const handleStatusCardFilter = useCallback((status: 'LOW' | 'OUT_OF_STOCK') => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? 'ALL' : status,
    }));
    setPage(0);
    window.setTimeout(() => {
      inventorySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  const handleDismissAlertBanner = useCallback(() => {
    sessionStorage.setItem('stockpulse-alert-banner-dismissed', '1');
    setAlertBannerDismissed(true);
  }, []);

  const handleSnoozeAlertBanner = useCallback(() => {
    setAlertBannerSnoozed(true);
  }, []);

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

  const handleEdit = async (id: number, data: { name: string; sku: string; category: string; minThreshold: number; price?: number }) => {
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
    const count = selectedIds.size;
    const ids = Array.from(selectedIds);
    try {
      await bulkAdjustStock(ids, delta, user.token);
      await loadData();
      setSelectedIds(new Set());
      toast(`Stock updated for ${count} item${count > 1 ? 's' : ''}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Bulk update failed', 'error');
    }
  };

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
    saveAuth(authUser);
    setShowLogin(false);
    toast(`Welcome, ${authUser.name || authUser.email}!`, 'success');
  };

  const handleLogout = async () => {
    if (user) {
      await logout(user.token).catch(() => {});
    }
    clearAuth();
    setUser(null);
    setSelectedIds(new Set());
    setShowScanner(false);
    toast('Logged out successfully', 'info');
  };

  const scrollToSection = useCallback((id: SectionId) => {
    const el = document.getElementById(`section-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleExportCsv = useCallback(async () => {
    const hasActiveFilters =
      filters.search !== '' || filters.category !== 'ALL' || filters.status !== 'ALL';
    setExportingCsv(true);
    try {
      const rows = hasActiveFilters
        ? await fetchInventoryMatchingFilters(
            filters.search,
            filters.category,
            filters.status,
            Math.max(totalElements, 5000),
          )
        : allItems;
      exportToCsv(rows, hasActiveFilters ? 'filtered' : 'all');
      toast(`Exported ${rows.length} row${rows.length === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    } finally {
      setExportingCsv(false);
    }
  }, [allItems, filters, toast, totalElements]);

  const focusInventoryItem = useCallback((item: InventoryItem) => {
    scrollToSection('inventory');
    setHighlightItemId(item.id);
    window.setTimeout(() => {
      document.getElementById(`inventory-row-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    window.setTimeout(() => setHighlightItemId(null), 4000);
  }, [scrollToSection]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isViewer = isLoggedIn && user.role === 'VIEWER';
  const showInitialLoad = loading && !hasBootstrapped;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-2 sm:p-2.5 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">StockPulse</h1>
                <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">Inventory Replenishment System</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {isLoggedIn ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-700">
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
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                  <span className="sm:hidden text-xs">Login</span>
                </button>
              )}
              <button
                type="button"
                disabled={!isLoggedIn}
                onClick={() => setShowScanner(true)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800"
                title={isLoggedIn ? 'Scan barcode/QR code' : 'Login to enable'}
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
              <span
                className={`hidden items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset sm:flex ${
                  wsConnected
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700'
                    : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600'
                }`}
                title={wsConnected ? 'WebSocket connected' : 'Polling every 30s'}
              >
                <span
                  className={`h-2 w-2 rounded-full ${wsConnected ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`}
                />
                {wsConnected ? 'Live' : 'Polling'}
              </span>
              {lastUpdatedAt && (
                <span className="hidden text-[10px] text-slate-400 lg:inline dark:text-slate-500">
                  Updated {lastUpdatedAt.toLocaleTimeString()}
                </span>
              )}
              <RefreshButton onClick={() => void loadData()} loading={loading || tableRefreshing} />
            </div>
          </div>
        </div>
      </header>

      {!isLoggedIn && (
        <div className="border-b border-slate-200/80 bg-slate-50/95 dark:border-slate-700/80 dark:bg-slate-900/60">
          <p className="mx-auto max-w-7xl px-4 py-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Viewing as guest —{' '}
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
            >
              log in
            </button>{' '}
            to edit stock.
          </p>
        </div>
      )}

      <SectionNav isLoggedIn={isLoggedIn} onNavigate={scrollToSection} />

      {isViewer && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          View-only access — contact an admin if you need to edit stock or purchase orders.
        </div>
      )}

      <main className="mx-auto max-w-7xl space-y-6 sm:space-y-8 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        {loadError && (
          <LoadErrorBanner
            message={loadError}
            onRetry={() => void loadData()}
            retrying={loading || tableRefreshing}
          />
        )}

        {showAlertBanner && (
          <LowStockBanner
            items={alertItems}
            onDismiss={handleDismissAlertBanner}
            onSnooze={handleSnoozeAlertBanner}
            onFilterLowStock={() => {
              setFilters((f) => ({ ...f, status: 'LOW' }));
              setPage(0);
              scrollToSection('inventory');
            }}
            onGoToPurchaseOrders={() => scrollToSection('purchase-orders')}
            onItemForecast={(item) => setForecastItem(item)}
          />
        )}

        <StatusOverview
          summary={summary}
          loading={showInitialLoad}
          activeStatus={filters.status}
          onFilterByStatus={handleStatusCardFilter}
        />

        <div id="section-charts" className="scroll-mt-32 space-y-2">
          {(showInitialLoad || allItems.length > 0) && (
            <DashboardCharts items={allItems} summary={summary} loading={showInitialLoad} />
          )}
          {allItems.length > 0 && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Charts reflect all {allItems.length} catalog items · table view may be filtered or paged
            </p>
          )}
        </div>

        {canEdit && (
          <AddItemForm categories={categories} onSubmit={handleCreate} submitting={creating} />
        )}

        <InventoryFilters
          filters={filters}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          categories={categories}
          onChange={(next) => {
            setFilters(next);
            if (next.search !== searchInput) setSearchInput(next.search);
          }}
          resultCount={totalElements}
          globalTotalItems={allItems.length}
        />

        <section
          id="section-inventory"
          ref={inventorySectionRef}
          className="scroll-mt-32"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Inventory List</h2>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setShowBulkUpdate(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700"
                >
                  <Layers className="h-4 w-4" />
                  Bulk ({selectedIds.size})
                </button>
              )}
              {(items.length > 0 || totalElements > 0) && (
                <button
                  type="button"
                  disabled={exportingCsv}
                  onClick={() => void handleExportCsv()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {exportingCsv ? 'Exporting…' : 'Export CSV (filtered)'}
                  </span>
                  <span className="sm:hidden">CSV</span>
                </button>
              )}
            </div>
          </div>
          {showInitialLoad ? (
            <InventoryTableSkeleton rows={pageSize} />
          ) : (
            <>
              <div
                className={`relative transition-opacity ${tableRefreshing ? 'pointer-events-none opacity-50' : ''}`}
              >
                {tableRefreshing && (
                  <div className="absolute inset-x-0 top-0 z-10 h-1 overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-700">
                    <div className="h-full w-1/3 animate-pulse bg-indigo-500" />
                  </div>
                )}
                <InventoryTable
                  items={items}
                  onAdjust={handleAdjust}
                  onEdit={(item) => setEditingItem(item)}
                  onDelete={handleDeleteRequest}
                  onHistory={(item) => setHistoryItem(item)}
                  onForecast={(item) => setForecastItem(item)}
                  adjustingId={adjustingId}
                  readonly={!canEdit}
                  canDelete={canDelete}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  highlightItemId={highlightItemId}
                  hasFilters={
                    filters.search !== '' || filters.category !== 'ALL' || filters.status !== 'ALL'
                  }
                />
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </section>

        <PurchaseOrders token={user?.token} canEdit={canEdit} />

        {isLoggedIn && (
          <WarehouseManagement token={user.token} canEdit={canEdit} canDelete={canDelete} />
        )}

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

      {forecastItem && (
        <ForecastPanel item={forecastItem} onClose={() => setForecastItem(null)} />
      )}

      {showScanner && isLoggedIn && (
        <BarcodeScanner
          items={allItems}
          onFound={(item) => {
            setShowScanner(false);
            setEditingItem(item);
            toast(`Found: ${item.name} (${item.sku})`, 'success');
          }}
          onAddNew={canEdit ? (prefilled) => {
            setShowScanner(false);
            void (async () => {
              try {
                await handleCreate(prefilled);
                toast(`Added "${prefilled.name}" to inventory!`, 'success');
              } catch (err) {
                toast(err instanceof Error ? err.message : 'Failed to add item', 'error');
              }
            })();
          } : undefined}
          onClose={() => setShowScanner(false)}
        />
      )}

      <CommandPalette
        open={showCommandPalette}
        items={allItems}
        onClose={() => setShowCommandPalette(false)}
        onSelectItem={focusInventoryItem}
        onFilterBySku={(sku) => {
          setSearchInput(sku);
          setFilters((f) => ({ ...f, search: sku }));
          setPage(0);
          scrollToSection('inventory');
        }}
      />

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
