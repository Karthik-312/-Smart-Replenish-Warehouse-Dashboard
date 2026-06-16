import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { InventoryItem, InventorySummary } from '../api/inventory';

interface DashboardChartsProps {
  items: InventoryItem[];
  summary: InventorySummary;
}

const STATUS_COLORS = {
  Healthy: '#10b981',
  Low: '#f59e0b',
  'Out of Stock': '#ef4444',
};

export default function DashboardCharts({ items, summary }: DashboardChartsProps) {
  const statusData = useMemo(() => [
    { name: 'Healthy', value: summary.totalItems - summary.lowStockItems - summary.outOfStockItems },
    { name: 'Low', value: summary.lowStockItems },
    { name: 'Out of Stock', value: summary.outOfStockItems },
  ].filter(d => d.value > 0), [summary]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const stockVsThreshold = useMemo(() => {
    return [...items]
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 10)
      .map((item) => ({
        name: item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name,
        stock: item.currentStock,
        threshold: item.minThreshold,
      }));
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Stock Status Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Items by Category</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Stock Levels vs. Min Threshold (Lowest 10)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stockVsThreshold} margin={{ bottom: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="stock" name="Current Stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="threshold" name="Min Threshold" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
