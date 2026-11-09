import { AlertTriangle, RefreshCw } from 'lucide-react';

interface LoadErrorBannerProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

export default function LoadErrorBanner({ message, onRetry, retrying }: LoadErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-800 dark:bg-rose-900/30"
    >
      <div className="flex items-center gap-2 text-sm text-rose-800 dark:text-rose-200">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        disabled={retrying}
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
        Retry
      </button>
    </div>
  );
}
