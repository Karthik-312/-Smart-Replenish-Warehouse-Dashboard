import { useCallback, useEffect, useState } from 'react';
import { Clock, X, ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { fetchItemHistory, type AuditLogEntry, type InventoryItem } from '../api/inventory';
import Pagination from './Pagination';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface AuditLogPanelProps {
  item: InventoryItem;
  onClose: () => void;
}

const actionIcons = {
  CREATE: Plus,
  UPDATE: Pencil,
  ADJUST: ArrowUp,
  DELETE: Trash2,
};

const actionColors = {
  CREATE: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40',
  UPDATE: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/40',
  ADJUST: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40',
  DELETE: 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/40',
};

const HISTORY_PAGE_SIZE = 10;

export default function AuditLogPanel({ item, onClose }: AuditLogPanelProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEscapeKey(true, onClose);

  const loadPage = useCallback(async (pageIndex: number) => {
    setLoading(true);
    try {
      const data = await fetchItemHistory(item.id, pageIndex, HISTORY_PAGE_SIZE);
      setEntries(data.content);
      setTotalPages(data.totalPages);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [item.id]);

  useEffect(() => {
    setPage(0);
  }, [item.id]);

  useEffect(() => {
    void loadPage(page);
  }, [loadPage, page]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">History</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const Icon = actionIcons[entry.action] || Clock;
                return (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${actionColors[entry.action]}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {entry.action === 'ADJUST' && entry.oldValue != null && entry.newValue != null ? (
                            <span className="flex items-center gap-1">
                              Stock: {entry.oldValue}
                              {entry.newValue > entry.oldValue ? (
                                <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-rose-500" />
                              )}
                              {entry.newValue}
                            </span>
                          ) : (
                            entry.details || entry.action
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">by {entry.changedBy}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {!loading && totalPages > 1 && (
          <div className="shrink-0 border-t border-slate-200 px-2 py-2 dark:border-slate-700">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
