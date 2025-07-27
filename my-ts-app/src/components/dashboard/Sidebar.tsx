import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Users, 
  UserCheck, 
  ShoppingCart,
  Fuel
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSection } from "../Dashboard";

interface SidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

const menuItems = [
  { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
  { id: 'sales' as const, label: 'Sales Performance', icon: TrendingUp },
  { id: 'inventory' as const, label: 'Inventory Management', icon: Package },
  { id: 'products' as const, label: 'Product Analysis', icon: ShoppingCart },
  { id: 'sale' as const, label: 'Sale', icon: ShoppingCart },
];

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  return (
    <div className="w-64 bg-card border-r border-border">
        <div className="max-w-7xl mx-auto px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                STS
              </h1>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
        
        <nav className="space-y-2 ">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                  isActive 
                    ? "bg-blue-500 text-white" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};