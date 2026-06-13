import { AlertTriangle, PackageX } from 'lucide-react';
import type { InventoryItem } from '../api/inventory';

interface LowStockBannerProps {
  items: InventoryItem[];
}

export default function LowStockBanner({ items }: LowStockBannerProps) {
  const outOfStock = items.filter((item) => item.status === 'OUT_OF_STOCK');
  const lowStock = items.filter((item) => item.status === 'LOW');

  if (outOfStock.length === 0 && lowStock.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {outOfStock.length > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 px-5 py-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-rose-100 p-2">
              <PackageX className="h-5 w-5 text-rose-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-rose-900">
                {outOfStock.length} item{outOfStock.length === 1 ? '' : 's'} out of stock — reorder now
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {outOfStock.map((item) => (
                  <li
                    key={item.id}
                    className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-rose-800 ring-1 ring-rose-200"
                  >
                    <span className="font-mono">{item.sku}</span>
                    <span className="text-rose-400">·</span>
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <AlertTriangle className="h-5 w-5 animate-pulse-warning text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-amber-900">
                {lowStock.length} item{lowStock.length === 1 ? '' : 's'} below minimum threshold
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                These products need replenishment before they run out.
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {lowStock.map((item) => (
                  <li
                    key={item.id}
                    className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200"
                  >
                    <span className="font-mono">{item.sku}</span>
                    <span className="text-amber-400">·</span>
                    {item.name}
                    <span className="text-amber-600">({item.currentStock}/{item.minThreshold})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
