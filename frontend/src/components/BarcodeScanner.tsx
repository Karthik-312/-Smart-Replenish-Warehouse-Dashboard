import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, PackagePlus, Search, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import type { InventoryItem } from '../api/inventory';

export interface ScannedNewItem {
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  price?: number;
}

interface LookupResult {
  name: string;
  brand: string;
  category: string;
  barcode: string;
  imageUrl?: string;
}

// A scanned product waiting for the user to fill in quantity and price before it is saved.
interface Draft {
  name: string;
  sku: string;
  category: string;
  imageUrl?: string;
  fromLookup: boolean;
}

const CATEGORIES = [
  'General',
  'Food & Beverages',
  'Household',
  'Personal Care',
  'Electronics',
  'Office Supplies',
];

async function lookupBarcodeFromBackend(barcode: string): Promise<LookupResult | null> {
  try {
    const base = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace('/inventory', '/barcode-lookup')
      : 'http://localhost:8080/api/barcode-lookup';
    const resp = await fetch(`${base}/${encodeURIComponent(barcode)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
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

interface BarcodeScannerProps {
  items: InventoryItem[];
  onFound: (item: InventoryItem) => void;
  onAddNew?: (prefilled: ScannedNewItem) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ items, onFound, onAddNew, onClose }: BarcodeScannerProps) {
  const [manualSku, setManualSku] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [added, setAdded] = useState<LookupResult | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [qty, setQty] = useState<number | ''>(1);
  const [price, setPrice] = useState<number | ''>('');
  const [threshold, setThreshold] = useState<number | ''>(5);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerDivId = 'qr-reader';

  const beginDraft = (next: Draft) => {
    setDraft(next);
    setQty(1);
    setPrice('');
    setThreshold(5);
  };

  const handleBarcode = async (barcode: string) => {
    setError(null);
    setAdded(null);
    setDraft(null);

    const found = items.find(
      (item) => item.sku.toLowerCase() === barcode.trim().toLowerCase(),
    );
    if (found) {
      onFound(found);
      return;
    }

    if (!onAddNew) {
      setError('Login required to add new items to inventory.');
      return;
    }

    setLookingUp(true);
    try {
      const result = await lookupBarcodeFromBackend(barcode.trim());
      if (result) {
        beginDraft({
          name: result.name,
          sku: result.barcode,
          category: result.category,
          imageUrl: result.imageUrl,
          fromLookup: true,
        });
      } else {
        beginDraft({ name: '', sku: barcode.trim(), category: 'General', fromLookup: false });
      }
    } catch {
      beginDraft({ name: '', sku: barcode.trim(), category: 'General', fromLookup: false });
    } finally {
      setLookingUp(false);
    }
  };

  const draftValid =
    draft !== null &&
    draft.name.trim() !== '' &&
    qty !== '' &&
    Number(qty) >= 0 &&
    price !== '' &&
    Number(price) >= 0 &&
    threshold !== '' &&
    Number(threshold) >= 0;

  const handleConfirmAdd = () => {
    if (!draft || !draftValid || !onAddNew) return;
    onAddNew({
      name: draft.name.trim(),
      sku: draft.sku,
      category: draft.category || 'General',
      currentStock: Number(qty),
      minThreshold: Number(threshold),
      price: Number(price),
    });
    setAdded({
      name: draft.name.trim(),
      brand: '',
      category: draft.category,
      barcode: draft.sku,
      imageUrl: draft.imageUrl,
    });
    setDraft(null);
    setTimeout(() => onClose(), 2000);
  };

  const startScanner = async () => {
    setError(null);
    setAdded(null);
    setDraft(null);
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(readerDivId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          void stopScanner();
          void handleBarcode(decodedText);
        },
        () => {},
      );
    } catch {
      setError('Could not access camera. Please check permissions or use manual input.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { void stopScanner(); };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSku.trim()) {
      setError(null);
      void handleBarcode(manualSku);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
              <Camera className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Scan Barcode/QR</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div id={readerDivId} className={scanning ? 'mb-4 min-h-[280px] overflow-hidden rounded-xl' : 'hidden'} />

        {added ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
            <div className="flex items-start gap-3">
              {added.imageUrl && <img src={added.imageUrl} alt={added.name} className="h-14 w-14 rounded-lg object-cover" />}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Added to inventory!</span>
                </div>
                <h4 className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{added.name}</h4>
                <p className="text-xs text-slate-500">{added.category} · <span className="font-mono">{added.barcode}</span></p>
              </div>
            </div>
          </div>
        ) : draft && onAddNew ? (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
            {draft.fromLookup ? (
              <div className="mb-3 flex items-start gap-3">
                {draft.imageUrl && <img src={draft.imageUrl} alt={draft.name} className="h-14 w-14 rounded-lg object-cover" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Product found</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="font-mono">{draft.sku}</span> · confirm the details below
                  </p>
                </div>
              </div>
            ) : (
              <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">
                Barcode <span className="font-mono font-bold">{draft.sku}</span> not found online. Enter the details:
              </p>
            )}

            <div className="space-y-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Product name</span>
                <input type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Godrej Fab Liquid Detergent" autoFocus={!draft.fromLookup} className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-700 dark:bg-slate-700 dark:text-slate-100" />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Category</span>
                <select value={CATEGORIES.includes(draft.category) ? draft.category : 'General'} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-indigo-700 dark:bg-slate-700 dark:text-slate-100">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Quantity</span>
                  <input type="number" value={qty} onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))} min={0} step={1} autoFocus={draft.fromLookup} className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-700 dark:bg-slate-700 dark:text-slate-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Price (₹)</span>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" min={0} step={0.01} className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-700 dark:bg-slate-700 dark:text-slate-100" />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Low-stock threshold</span>
                <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value === '' ? '' : Number(e.target.value))} min={0} step={1} className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-700 dark:bg-slate-700 dark:text-slate-100" />
              </label>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setDraft(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  Cancel
                </button>
                <button type="button" onClick={handleConfirmAdd} disabled={!draftValid} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                  <PackagePlus className="h-4 w-4" />
                  Add to Inventory
                </button>
              </div>
            </div>
          </div>
        ) : lookingUp ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-6 dark:bg-indigo-900/20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Searching product databases...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {!scanning && (
              <button type="button" onClick={() => void startScanner()} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400">
                <Camera className="h-5 w-5" />
                Start Camera Scanner
              </button>
            )}
            {scanning && (
              <button type="button" onClick={() => void stopScanner()} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                Stop Camera
              </button>
            )}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 dark:bg-slate-800">or enter barcode manually</span></div>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input type="text" value={manualSku} onChange={(e) => setManualSku(e.target.value)} placeholder="Enter barcode (e.g. 8901023029721)" className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
              <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</p>
        )}
      </div>
    </div>
  );
}
