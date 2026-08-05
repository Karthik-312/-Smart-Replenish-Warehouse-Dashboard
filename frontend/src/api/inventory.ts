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
  price?: number;
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface AuthUser {
  token: string;
  email: string;
  name: string;
  picture: string;
  role: UserRole;
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

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const response = await fetch(`${API_BASE}`);
  return handleResponse<InventoryItem[]>(response);
}

export async function fetchInventoryPaged(
  page: number,
  size: number,
  search?: string,
  category?: string,
  status?: string,
): Promise<PagedResponse<InventoryItem>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) params.set('search', search);
  if (category && category !== 'ALL') params.set('category', category);
  if (status && status !== 'ALL') params.set('status', status);
  const response = await fetch(`${API_BASE}/paged?${params}`);
  return handleResponse<PagedResponse<InventoryItem>>(response);
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
  data: Partial<Pick<InventoryItem, 'name' | 'sku' | 'category' | 'minThreshold' | 'price'>>,
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

export interface Supplier {
  id: number;
  name: string;
  contactEmail: string;
  phone: string;
  address: string;
  notes: string;
}

const SUPPLIER_BASE =
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/inventory', '/suppliers')
    : 'http://localhost:8080/api/suppliers';

export async function fetchSuppliers(): Promise<Supplier[]> {
  const response = await fetch(SUPPLIER_BASE);
  return handleResponse<Supplier[]>(response);
}

export async function createSupplier(supplier: Omit<Supplier, 'id'>, token: string): Promise<Supplier> {
  const response = await fetch(SUPPLIER_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders(token) },
    body: JSON.stringify(supplier),
  });
  return handleResponse<Supplier>(response);
}

export async function updateSupplier(id: number, supplier: Omit<Supplier, 'id'>, token: string): Promise<Supplier> {
  const response = await fetch(`${SUPPLIER_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders(token) },
    body: JSON.stringify(supplier),
  });
  return handleResponse<Supplier>(response);
}

export async function deleteSupplier(id: number, token: string): Promise<void> {
  const response = await fetch(`${SUPPLIER_BASE}/${id}`, {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  await handleResponse(response);
}

export interface AuditLogEntry {
  id: number;
  itemId: number;
  itemName: string;
  action: 'CREATE' | 'UPDATE' | 'ADJUST' | 'DELETE';
  details: string | null;
  oldValue: number | null;
  newValue: number | null;
  changedBy: string;
  timestamp: string;
}

export async function fetchItemHistory(
  id: number,
  page = 0,
  size = 20,
): Promise<PagedResponse<AuditLogEntry>> {
  const response = await fetch(`${API_BASE}/${id}/history?page=${page}&size=${size}`);
  return handleResponse<PagedResponse<AuditLogEntry>>(response);
}

// --- Warehouses ---

const WAREHOUSE_BASE =
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/inventory', '/warehouses')
    : 'http://localhost:8080/api/warehouses';

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  default: boolean;
}

export interface WarehouseStock {
  id: number;
  warehouseId: number;
  itemId: number;
  quantity: number;
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const response = await fetch(WAREHOUSE_BASE);
  return handleResponse<Warehouse[]>(response);
}

export async function createWarehouse(w: Omit<Warehouse, 'id'>, token: string): Promise<Warehouse> {
  const response = await fetch(WAREHOUSE_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders(token) },
    body: JSON.stringify(w),
  });
  return handleResponse<Warehouse>(response);
}

export async function updateWarehouse(id: number, w: Omit<Warehouse, 'id'>, token: string): Promise<Warehouse> {
  const response = await fetch(`${WAREHOUSE_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders(token) },
    body: JSON.stringify(w),
  });
  return handleResponse<Warehouse>(response);
}

export async function deleteWarehouse(id: number, token: string): Promise<void> {
  const response = await fetch(`${WAREHOUSE_BASE}/${id}`, {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  await handleResponse(response);
}

export async function fetchWarehouseStock(warehouseId: number): Promise<WarehouseStock[]> {
  const response = await fetch(`${WAREHOUSE_BASE}/${warehouseId}/stock`);
  return handleResponse<WarehouseStock[]>(response);
}

export async function fetchItemWarehouseBreakdown(itemId: number): Promise<WarehouseStock[]> {
  const response = await fetch(`${WAREHOUSE_BASE}/item/${itemId}/breakdown`);
  return handleResponse<WarehouseStock[]>(response);
}

// --- Purchase Orders ---

const PO_BASE =
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/inventory', '/purchase-orders')
    : 'http://localhost:8080/api/purchase-orders';

export type PurchaseOrderStatus = 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder {
  id: number;
  itemId: number;
  itemName: string;
  sku: string;
  supplierId: number | null;
  quantity: number;
  status: PurchaseOrderStatus;
  createdAt: string;
  updatedAt: string;
}

export async function fetchPurchaseOrders(status?: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
  const params = status ? `?status=${status}` : '';
  const response = await fetch(`${PO_BASE}${params}`);
  return handleResponse<PurchaseOrder[]>(response);
}

export async function updatePurchaseOrderStatus(
  id: number,
  status: PurchaseOrderStatus,
  token: string,
): Promise<PurchaseOrder> {
  const response = await fetch(`${PO_BASE}/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...bearerHeaders(token) },
    body: JSON.stringify({ status }),
  });
  return handleResponse<PurchaseOrder>(response);
}

// --- Demand Forecast ---

export interface DemandForecast {
  avgDailyConsumption: number;
  daysUntilStockout: number;
  suggestedReorderQty: number;
  dataPoints: number;
}

export async function fetchForecast(itemId: number, days = 30): Promise<DemandForecast> {
  const response = await fetch(`${API_BASE}/${itemId}/forecast?days=${days}`);
  return handleResponse<DemandForecast>(response);
}
