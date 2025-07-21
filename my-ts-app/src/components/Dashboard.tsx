import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "./dashboard/Overview";
import { InventoryManagement } from "./dashboard/InventoryManagement";
import { SalesPerformance } from "./dashboard/SalesPerformance";
import { Input } from "@/components/ui/input"
// import { EmployeePerformance } from "./dashboard/EmployeePerformance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ProductAnalysis } from "./dashboard/ProductsAnalysis";
import { Sidebar } from "./dashboard/Sidebar"; // ✅ Correct
import { getlogin } from "@/services/loginService";
import { SaleForm } from "./dashboard/salePage";

export type DashboardSection = 
  | 'overview' 
  | 'sales' 
  | 'inventory' 
  | 'customers' 
  | 'employees' 
  | 'products'
  | 'sale';


export const Dashboard = () => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  const [login, setLogin] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: ""});


  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault(); // Prevent form reload
  const data = await getlogin(loginForm);
  // Optional delay (e.g. 1 second)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (data.user) {
    setLogin(true);
  } else {
    alert("Please login againnkfjsajflf");
  }
};


  const renderRoleSelection = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Stock Tracking System</CardTitle>
            <CardDescription>Sign in to access the management system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-300">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview />;
      case 'sales':
        return <SalesPerformance 
        />;
      case 'inventory':
        return <InventoryManagement 
        />;
      case 'products':
        return <ProductAnalysis />;
      case 'sale':
        return <SaleForm />;
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