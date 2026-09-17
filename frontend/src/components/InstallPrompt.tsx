import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallPrompt() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up sm:left-auto sm:right-6 sm:bottom-6">
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-white p-4 shadow-xl shadow-indigo-100/50 dark:border-indigo-700 dark:bg-slate-800 dark:shadow-indigo-900/30">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Install StockPulse
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add to your home screen for a native app experience
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void install()}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 active:scale-95"
          >
            Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
