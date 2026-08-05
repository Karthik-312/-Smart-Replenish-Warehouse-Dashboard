export interface ProductLookupResult {
  name: string;
  brand: string;
  category: string;
  barcode: string;
  imageUrl?: string;
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/inventory', '/barcode-lookup')
    : 'http://localhost:8080/api/barcode-lookup';

/**
 * Looks up a product by barcode via our backend (which searches multiple databases server-side,
 * avoiding CORS issues that block direct browser requests to external APIs).
 */
export async function lookupBarcode(barcode: string): Promise<ProductLookupResult | null> {
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(barcode)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.found) return null;

    return {
      name: data.name || '',
      brand: data.brand || '',
      category: data.category || 'General',
      barcode: data.barcode || barcode,
      imageUrl: data.imageUrl || undefined,
    };
  } catch {
    return null;
  }
}
