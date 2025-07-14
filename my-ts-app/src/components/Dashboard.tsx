import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Overview } from "./dashboard/Overview";
import { SalesPerformance } from "./dashboard/SalesPerformance";
import { InventoryManagement } from "./dashboard/InventoryManagement";
import { CustomerInsights } from "./dashboard/CustomerInsights";
// import { EmployeePerformance } from "./dashboard/EmployeePerformance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ProductAnalysis } from "./dashboard/ProductsAnalysis";
import { Sidebar } from "./dashboard/Sidebar"; // ✅ Correct

export type DashboardSection = 
  | 'overview' 
  | 'sales' 
  | 'inventory' 
  | 'customers' 
  | 'employees' 
  | 'products';

const DashboardRole = [
  {
    value: 'Admin',
    username: 'postgres',
    password: 'Alg0r1thm@c#',
  },
  {
    value: 'Manager',
    username: '',
    password: ''
  },
]

export const Dashboard = () => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [role, setRole] = useState<string>('');
  const [login, setLogin] = useState<boolean>(false);

  const handleLogin = () => {
    if (role) {
      setLogin(true);
    } else {
      alert("Please select a role.");
    }
  };

  const renderRoleSelection = () => {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-100">
        <div className="w-64">
          <Label htmlFor="role">Select Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Cashier">Cashier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleLogin}>Login</Button>
      </div>
    );
  };
  
  const renderContent = () => {
    switch (activeSection) {
      // case 'overview':
      //   return <Overview />;
      // case 'sales':
      //   return <SalesPerformance 
      //   />;
      // case 'inventory':
      //   return <InventoryManagement 
      //   />;
      // case 'customers':
      //   return <CustomerInsights />;
    //   case 'employees':
    //     return <EmployeePerformance />;
      case 'products':
        return <ProductAnalysis />;
      default:
        return <Overview />;
    }
  };

  return (
    <>
      {!login ? (
        renderRoleSelection()
      ) : (
        <div className="flex min-h-screen bg-background">
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection}/>
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>
      )}
    </>
  );
};