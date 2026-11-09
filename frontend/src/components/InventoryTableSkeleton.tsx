export default function InventoryTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="animate-pulse space-y-0 divide-y divide-slate-100 dark:divide-slate-700">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-600" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-600" />
              <div className="h-2 w-24 rounded bg-slate-100 dark:bg-slate-700" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-600" />
          </div>
        ))}
      </div>
    </div>
  );
}
