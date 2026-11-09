import { BarChart3, Boxes, ClipboardList, LayoutDashboard, Truck, Warehouse } from 'lucide-react';

export type SectionId =
  | 'overview'
  | 'charts'
  | 'inventory'
  | 'purchase-orders'
  | 'warehouses'
  | 'suppliers';

const links: { id: SectionId; label: string; icon: typeof Boxes; guest?: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, guest: true },
  { id: 'charts', label: 'Charts', icon: BarChart3, guest: true },
  { id: 'inventory', label: 'Inventory', icon: Boxes, guest: true },
  { id: 'purchase-orders', label: 'Orders', icon: ClipboardList, guest: true },
  { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
];

interface SectionNavProps {
  isLoggedIn: boolean;
  onNavigate: (id: SectionId) => void;
}

export default function SectionNav({ isLoggedIn, onNavigate }: SectionNavProps) {
  const visible = links.filter((l) => l.guest || isLoggedIn);

  return (
    <nav
      aria-label="Page sections"
      className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/90"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 sm:px-6 lg:px-8">
        {visible.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300 sm:text-sm"
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
