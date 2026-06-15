import { useEffect, useRef, useState } from 'react';
import { Camera, Search, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import type { InventoryItem } from '../api/inventory';

interface BarcodeScannerProps {
  items: InventoryItem[];
  onFound: (item: InventoryItem) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ items, onFound, onClose }: BarcodeScannerProps) {
  const [manualSku, setManualSku] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerDivId = 'qr-reader';

  const lookupSku = (sku: string) => {
    const found = items.find(
      (item) => item.sku.toLowerCase() === sku.trim().toLowerCase(),
    );
    if (found) {
      onFound(found);
    } else {
      setError(`No item found with SKU: "${sku.trim()}"`);
    }
  };

  const startScanner = async () => {
    setError(null);
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(readerDivId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          void stopScanner();
          lookupSku(decodedText);
        },
        () => {},
      );
    } catch (err) {
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
    return () => {
      void stopScanner();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSku.trim()) {
      setError(null);
      lookupSku(manualSku);
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div
            id={readerDivId}
            className={`overflow-hidden rounded-xl ${scanning ? 'min-h-[280px]' : 'hidden'}`}
          />

          {!scanning && (
            <button
              type="button"
              onClick={() => void startScanner()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
            >
              <Camera className="h-5 w-5" />
              Start Camera Scanner
            </button>
          )}

          {scanning && (
            <button
              type="button"
              onClick={() => void stopScanner()}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              Stop Camera
            </button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400 dark:bg-slate-800">or enter manually</span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value)}
              placeholder="Enter SKU (e.g. WM-001)"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
