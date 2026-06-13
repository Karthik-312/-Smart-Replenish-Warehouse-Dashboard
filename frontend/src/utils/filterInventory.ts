import type { InventoryItem } from '../api/inventory';
import type { InventoryFilterState } from '../components/InventoryFilters';

export function filterInventory(items: InventoryItem[], filters: InventoryFilterState): InventoryItem[] {
  const query = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.category !== 'ALL' && item.category !== filters.category) {
      return false;
    }
    if (filters.status !== 'ALL' && item.status !== filters.status) {
      return false;
    }
    if (!query) {
      return true;
    }
    return (
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });
}

export function uniqueCategories(items: InventoryItem[]): string[] {
  return [...new Set(items.map((item) => item.category))].sort();
}
