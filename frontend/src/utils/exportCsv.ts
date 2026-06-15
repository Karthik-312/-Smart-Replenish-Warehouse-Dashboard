import type { InventoryItem } from '../api/inventory';

const STATUS_LABELS: Record<string, string> = {
  HEALTHY: 'Healthy',
  LOW: 'Low',
  OUT_OF_STOCK: 'Out of Stock',
};

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(items: InventoryItem[]): void {
  const headers = ['Name', 'SKU', 'Category', 'Current Stock', 'Min Threshold', 'Status'];

  const rows = items.map((item) => [
    escapeCsvField(item.name),
    escapeCsvField(item.sku),
    escapeCsvField(item.category),
    item.currentStock,
    item.minThreshold,
    STATUS_LABELS[item.status] ?? item.status,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `stockpulse-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
