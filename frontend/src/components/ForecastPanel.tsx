import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, AlertTriangle, X, BarChart3 } from 'lucide-react';
import { fetchForecast, type DemandForecast, type InventoryItem } from '../api/inventory';

interface Props {
  item: InventoryItem;
  onClose: () => void;
}

export default function ForecastPanel({ item, onClose }: Props) {
  const [forecast, setForecast] = useState<DemandForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchForecast(item.id)
      .then(setForecast)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load forecast'))
      .finally(() => setLoading(false));
  }, [item.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Demand Forecast</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {item.name} ({item.sku}) — based on last 30 days
        </p>

        {loading && <p className="text-sm text-slate-500">Calculating forecast...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {forecast && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Daily Consumption</p>
                <p className="mt-1 text-xl font-bold text-slate-800 dark:text-slate-100">
                  {forecast.avgDailyConsumption}
                  <span className="ml-1 text-xs font-normal text-slate-400">units/day</span>
                </p>
              </div>
              <div className={`rounded-xl border p-3 ${
                forecast.daysUntilStockout < 7
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : forecast.daysUntilStockout < 14
                  ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}>
                <p className="text-xs text-slate-500 dark:text-slate-400">Days Until Stockout</p>
                <div className="mt-1 flex items-center gap-1">
                  {forecast.daysUntilStockout < 7 ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : forecast.daysUntilStockout < 14 ? (
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  )}
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {forecast.daysUntilStockout >= 999 ? '∞' : forecast.daysUntilStockout}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Suggested Reorder Quantity</p>
              <p className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {forecast.suggestedReorderQty} units
              </p>
              <p className="text-xs text-slate-400">(covers 14 days of demand)</p>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500">
              Based on {forecast.dataPoints} consumption data point{forecast.dataPoints !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
