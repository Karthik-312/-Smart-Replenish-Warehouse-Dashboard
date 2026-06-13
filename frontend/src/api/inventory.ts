const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/inventory';

export type StockStatus = 'HEALTHY' | 'LOW' | 'OUT_OF_STOCK';

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  status: StockStatus;
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return response.json();
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const response = await fetch(`${API_BASE}`);
  return handleResponse<InventoryItem[]>(response);
}

export async function fetchSummary(): Promise<InventorySummary> {
  const response = await fetch(`${API_BASE}/summary`);
  return handleResponse<InventorySummary>(response);
}

export async function adjustStock(id: number, delta: number): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}/${id}/adjust?delta=${delta}`, {
    method: 'POST',
  });
  return handleResponse<InventoryItem>(response);
}

export async function createItem(item: Omit<InventoryItem, 'id' | 'status'>): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleResponse<InventoryItem>(response);
}

export async function deleteItem(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  await handleResponse(response);
}
