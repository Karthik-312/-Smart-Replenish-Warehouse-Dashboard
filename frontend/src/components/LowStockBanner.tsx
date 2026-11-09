import type { ReactNode } from 'react';
import { AlertTriangle, Clock, PackageX, X } from 'lucide-react';
import type { InventoryItem } from '../api/inventory';

interface LowStockBannerProps {
  items: InventoryItem[];
  onDismiss: () => void;
  onSnooze: () => void;
}

export default function LowStockBanner({ items, onDismiss, onSnooze }: LowStockBannerProps) {
  const outOfStock = items.filter((item) => item.status === 'OUT_OF_STOCK');
  const lowStock = items.filter((item) => item.status === 'LOW');

  if (outOfStock.length === 0 && lowStock.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {outOfStock.length > 0 && (
        <AlertBlock
          tone="rose"
          icon={PackageX}
          title={`${outOfStock.length} item${outOfStock.length === 1 ? '' : 's'} out of stock — reorder now`}
          onDismiss={onDismiss}
          onSnooze={onSnooze}
        >
          <ul className="mt-2 flex flex-wrap gap-2">
            {outOfStock.map((item) => (
              <li
                key={item.id}
                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-rose-800 ring-1 ring-rose-200 dark:bg-slate-800/80 dark:text-rose-300 dark:ring-rose-700"
              >
                <span className="font-mono">{item.sku}</span>
                <span className="text-rose-400">·</span>
                {item.name}
              </li>
            ))}
          </ul>
        </AlertBlock>
      )}

      {lowStock.length > 0 && (
        <AlertBlock
          tone="amber"
          icon={AlertTriangle}
          iconPulse
          title={`${lowStock.length} item${lowStock.length === 1 ? '' : 's'} below minimum threshold`}
          subtitle="These products need replenishment before they run out."
          onDismiss={onDismiss}
          onSnooze={onSnooze}
        >
          <ul className="mt-2 flex flex-wrap gap-2">
            {lowStock.map((item) => (
              <li
                key={item.id}
                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 dark:bg-slate-800/80 dark:text-amber-300 dark:ring-amber-700"
              >
                <span className="font-mono">{item.sku}</span>
                <span className="text-amber-400">·</span>
                {item.name}
                <span className="text-amber-600 dark:text-amber-400">
                  ({item.currentStock}/{item.minThreshold})
                </span>
              </li>
            ))}
          </ul>
        </AlertBlock>
      )}
    </div>
  );
}

function AlertBlock({
  tone,
  icon: Icon,
  iconPulse,
  title,
  subtitle,
  children,
  onDismiss,
  onSnooze,
}: {
  tone: 'rose' | 'amber';
  icon: typeof PackageX;
  iconPulse?: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onDismiss: () => void;
  onSnooze: () => void;
}) {
  const styles =
    tone === 'rose'
      ? {
          wrap: 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 dark:border-rose-800 dark:from-rose-900/30 dark:to-red-900/30',
          iconBox: 'bg-rose-100 dark:bg-rose-900/50',
          icon: 'text-rose-600 dark:text-rose-400',
          title: 'text-rose-900 dark:text-rose-200',
          subtitle: 'text-rose-800 dark:text-rose-300',
          snooze:
            'text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-900/40',
          dismiss:
            'text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-900/40',
        }
      : {
          wrap: 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-900/30 dark:to-orange-900/30',
          iconBox: 'bg-amber-100 dark:bg-amber-900/50',
          icon: 'text-amber-600 dark:text-amber-400',
          title: 'text-amber-900 dark:text-amber-200',
          subtitle: 'text-amber-800 dark:text-amber-300',
          snooze:
            'text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40',
          dismiss:
            'text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40',
        };

  return (
    <div role="alert" className={`rounded-2xl border px-5 py-4 shadow-sm ${styles.wrap}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-lg p-2 ${styles.iconBox}`}>
          <Icon
            className={`h-5 w-5 ${styles.icon} ${iconPulse ? 'animate-pulse-warning' : ''}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={`font-semibold ${styles.title}`}>{title}</h3>
              {subtitle && <p className={`mt-1 text-sm ${styles.subtitle}`}>{subtitle}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onSnooze}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${styles.snooze}`}
                title="Hide until you refresh the page"
              >
                <Clock className="h-3.5 w-3.5" />
                Snooze
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className={`rounded-lg p-1.5 transition ${styles.dismiss}`}
                aria-label="Dismiss alerts for this session"
                title="Dismiss for this browser tab"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
