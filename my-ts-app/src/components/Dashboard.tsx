import { useEffect, useState } from "react";
import { Loader2, Menu, Package, X, BarChart3, ShieldCheck, Boxes } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Overview } from "./dashboard/Overview";
import { InventoryManagement } from "./dashboard/InventoryManagement";
import { SalesPerformance } from "./dashboard/SalesPerformance";
import { ProductAnalysis } from "./dashboard/ProductsAnalysis";
import { Sidebar } from "./dashboard/Sidebar";
import { getlogin } from "@/services/loginService";
import { clearToken, errorText, getToken } from "@/lib/session";
import { FilterProvider } from "@/hooks/useFilters";
import { SaleForm } from "./dashboard/salePage";

export type DashboardSection =
  | 'overview'
  | 'sales'
  | 'inventory'
  | 'customers'
  | 'employees'
  | 'products'
  | 'sale';

const TITLES: Record<string, string> = {
  overview: "Overview", sales: "Sales Performance", inventory: "Inventory", products: "Products", sale: "New Sale",
};

export const Dashboard = () => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  // already signed in? (a page refresh keeps the session; an expired one is caught by the first request)
  const [login, setLogin] = useState<boolean>(() => !!getToken());
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setLoginError("");
    try {
      const data = await getlogin(loginForm);
      if (data.user) setLogin(true);
      else setLoginError("Please check your username and password.");
    } catch (e) {
      setLoginError(errorText(e, "Could not sign in. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const logout = () => { clearToken(); setLogin(false); setLoginForm({ username: "", password: "" }); setActiveSection('overview'); };

  // the server says our session ended (token expired): go back to the sign-in screen with a short explanation
  useEffect(() => {
    const onLogout = () => { setLogin(false); setActiveSection('overview'); setLoginError("Your session ended. Please sign in again."); };
    window.addEventListener("sts:logout", onLogout);
    return () => window.removeEventListener("sts:logout", onLogout);
  }, []);

  const renderLogin = () => (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur"><Package className="h-5 w-5" /></span>
          <span className="text-lg font-bold tracking-tight">Stock Tracking System</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Know what sells, what's running low, and what you earn.</h2>
          <ul className="mt-8 space-y-4 text-indigo-100">
            <li className="flex items-center gap-3"><BarChart3 className="h-5 w-5 shrink-0" /> Live revenue and profit charts</li>
            <li className="flex items-center gap-3"><Boxes className="h-5 w-5 shrink-0" /> Stock levels and low-stock alerts</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 shrink-0" /> Simple, secure sign in</li>
          </ul>
        </div>
        <p className="relative text-sm text-indigo-200">© {new Date().getFullYear()} STS</p>
      </div>

      {/* form */}
      <div className="flex items-center justify-center bg-white p-6">
        <form onSubmit={handleLogin} className="fade-up w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 text-indigo-700"><Package className="h-6 w-6" /><span className="font-bold">STS</span></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500">Sign in to your dashboard</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" className="h-11 rounded-xl" placeholder="Enter your username" autoComplete="username"
              value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" className="h-11 rounded-xl" placeholder="Enter your password" autoComplete="current-password"
              value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
          </div>
          {loginError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loginError}</p>}
          <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-95">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </Button>
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <Overview />;
      case 'sales': return <SalesPerformance />;
      case 'inventory': return <InventoryManagement />;
      case 'products': return <ProductAnalysis />;
      case 'sale': return <SaleForm />;
      default: return <Overview />;
    }
  };

  if (!login) return renderLogin();

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200/70 lg:block">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={logout} />
      </aside>

      {/* mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 font-semibold text-slate-900"><Package className="h-5 w-5 text-indigo-600" />{TITLES[activeSection]}</div>
        <button aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((o) => !o)} className="rounded-lg p-2 hover:bg-slate-100">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-20 pt-14 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-72 shadow-xl">
            <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={logout} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-[1280px]"><FilterProvider>{renderContent()}</FilterProvider></div>
      </main>
    </div>
  );
};
