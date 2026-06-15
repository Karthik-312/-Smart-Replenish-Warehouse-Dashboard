const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/inventory';
const AUTH_BASE =
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/inventory', '/auth')
    : 'http://localhost:8080/api/auth';

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

export interface AuthUser {
  token: string;
  email: string;
  name: string;
  picture: string;
}

function bearerHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error('Unauthorized — this email is not an admin');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return response.json();
}

export async function googleLogin(idToken: string): Promise<AuthUser> {
  const response = await fetch(`${AUTH_BASE}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  return handleResponse<AuthUser>(response);
}

export async function logout(token: string): Promise<void> {
  await fetch(`${AUTH_BASE}/logout`, {
    method: 'POST',
    headers: bearerHeaders(token),
  });
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const response = await fetch(`${API_BASE}`);
  return handleResponse<InventoryItem[]>(response);
}

export async function fetchSummary(): Promise<InventorySummary> {
  const response = await fetch(`${API_BASE}/summary`);
  return handleResponse<InventorySummary>(response);
}

export async function adjustStock(id: number, delta: number, token: string): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}/${id}/adjust?delta=${delta}`, {
    method: 'POST',
    headers: bearerHeaders(token),
  });
  return handleResponse<InventoryItem>(response);
}

export async function createItem(item: Omit<InventoryItem, 'id' | 'status'>, token: string): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders(token) },
    body: JSON.stringify(item),
  });
  return handleResponse<InventoryItem>(response);
}

export async function updateItem(
  id: number,
  data: Partial<Pick<InventoryItem, 'name' | 'sku' | 'category' | 'minThreshold'>>,
  token: string,
): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders(token) },
    body: JSON.stringify(data),
  });
  return handleResponse<InventoryItem>(response);
}

export async function bulkAdjustStock(
  ids: number[],
  delta: number,
  token: string,
): Promise<InventoryItem[]> {
  const results = await Promise.all(
    ids.map((id) => adjustStock(id, delta, token)),
  );
  return results;
}

export async function deleteItem(id: number, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  await handleResponse(response);
}
