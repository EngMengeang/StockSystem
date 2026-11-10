import { LayoutDashboard, TrendingUp, Boxes, ShoppingBag, ReceiptText, LogOut, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSection } from "../Dashboard";

interface SidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  onLogout: () => void;
  onNavigate?: () => void; // used by the mobile drawer to close itself
}

const groups = [
  { title: "Analytics", items: [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'sales' as const, label: 'Sales Performance', icon: TrendingUp },
    { id: 'inventory' as const, label: 'Inventory', icon: Boxes },
  ]},
  { title: "Manage", items: [
    { id: 'products' as const, label: 'Products', icon: ShoppingBag },
    { id: 'sale' as const, label: 'New Sale', icon: ReceiptText },
  ]},
];

export const Sidebar = ({ activeSection, onSectionChange, onLogout, onNavigate }: SidebarProps) => {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-3 px-6">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
          <Package className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-base font-bold tracking-tight text-slate-900">STS</p>
          <p className="text-[11px] font-medium text-slate-500">Stock Tracking System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4" aria-label="Main">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.title}</p>
            <ul className="space-y-1">
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => { onSectionChange(item.id); onNavigate?.(); }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                        active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />}
                      <Icon className={cn("h-[18px] w-[18px]", active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">A</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-slate-900">Admin</p>
            <p className="text-xs text-slate-500">Store manager</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
};
