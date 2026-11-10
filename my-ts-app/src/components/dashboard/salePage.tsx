import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Minus, Plus, Search, ShoppingCart, Trash2, XCircle } from "lucide-react";
import { getMyProducts, postSalesBatch } from "@/services/productService";
import { pick, parseNumber } from "@/lib/csv";
import { errorText } from "@/lib/session";
import { PageHeader, Panel, Pill, Empty } from "./kit";
import { CsvImporter, type RowError } from "./CsvImporter";
import { cn } from "@/lib/utils";

interface ProductRow {
  p_id: number; p_name: string; p_price: number; reorder_level?: number;
  category?: { name: string } | null; Stock?: { s_quantity: number } | null;
}
interface SaleCsvRow { p_id: number; name: string; quantity: number; date?: string }

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SaleForm() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});   // p_id -> quantity
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const load = () => getMyProducts().then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const types = useMemo(() => [...new Set(products.map((p) => p.category?.name).filter(Boolean) as string[])], [products]);
  const stockOf = (p: ProductRow) => p.Stock?.s_quantity ?? 0;
  const visible = products.filter((p) =>
    (!type || p.category?.name === type) && p.p_name.toLowerCase().includes(search.trim().toLowerCase()));

  const lines = products.filter((p) => cart[p.p_id]).map((p) => ({ p, qty: cart[p.p_id] }));
  const total = lines.reduce((s, l) => s + l.qty * Number(l.p.p_price), 0);
  const units = lines.reduce((s, l) => s + l.qty, 0);

  const setQty = (p: ProductRow, qty: number) => {
    setResult(null);
    setCart((c) => {
      const next = { ...c };
      const q = Math.min(qty, stockOf(p));
      if (q <= 0) delete next[p.p_id]; else next[p.p_id] = q;
      return next;
    });
  };

  const checkout = async () => {
    setBusy(true); setResult(null);
    try {
      const r = await postSalesBatch(lines.map((l) => ({ p_id: l.p.p_id, quantity: l.qty })));
      setResult({ ok: true, text: `Sale recorded: ${r.units} item${r.units === 1 ? "" : "s"}, ${fmt(r.total)}` });
      setCart({});
      load();
    } catch (e) {
      setResult({ ok: false, text: errorText(e, "Could not record the sale.") });
      load();   // the stock may have changed under us: show the real numbers again
    } finally { setBusy(false); }
  };

  // ---- CSV import of sales ----
  const parseSales = (raw: Record<string, string>[]) => {
    const rows: SaleCsvRow[] = []; const errors: RowError[] = [];
    const byName = new Map(products.map((p) => [p.p_name.trim().toLowerCase(), p]));
    const left = new Map(products.map((p) => [p.p_id, stockOf(p)]));
    const today = new Date().toISOString().slice(0, 10);
    raw.forEach((r, i) => {
      const row = i + 2; // spreadsheet row (row 1 is the header)
      const name = pick(r, "product", "productname", "name", "item", "pname");
      const qty = parseNumber(pick(r, "quantity", "qty", "units"));
      const date = pick(r, "date", "day", "when");
      const p = byName.get(name.toLowerCase());
      if (!name) return errors.push({ row, message: "Product is missing" });
      if (!p) return errors.push({ row, message: `Unknown product "${name}"` });
      if (!Number.isInteger(qty) || qty <= 0) return errors.push({ row, message: `Quantity must be a whole number above 0 (${name})` });
      if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today)) return errors.push({ row, message: `Date must look like 2026-11-05 and not be in the future (${name})` });
      if ((left.get(p.p_id) ?? 0) < qty) return errors.push({ row, message: `Not enough stock for ${p.p_name} (${left.get(p.p_id) ?? 0} left)` });
      left.set(p.p_id, (left.get(p.p_id) ?? 0) - qty);
      rows.push({ p_id: p.p_id, name: p.p_name, quantity: qty, date: date || undefined });
    });
    return { rows, errors };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Sale" subtitle="Click Add on the products being sold, then complete the sale. Or import many sales from a CSV file.">
        <div className="flex flex-wrap items-center gap-2">
          <a href="/samples/sample-sales.csv" download className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
            <Download className="h-4 w-4" /> Sample CSV
          </a>
          <button onClick={() => setCsvOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/50">
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" /> Import CSV
          </button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ---------- all products, one click to add ---------- */}
        <Panel className="lg:col-span-3" title="Products" subtitle={`${visible.length} of ${products.length} shown`}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input aria-label="Search products" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-52 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
            </div>
          }>
          <div className="mb-4 flex flex-wrap gap-2">
            {["", ...types].map((t) => (
              <button key={t || "all"} onClick={() => setType(t)} aria-pressed={type === t}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  type === t ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                {t || "All"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid h-48 place-items-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : visible.length === 0 ? <Empty>No products match</Empty> : (
            <ul className="scroll-soft grid max-h-[640px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => {
                const stock = stockOf(p), inCart = cart[p.p_id] ?? 0, out = stock <= 0, maxed = inCart >= stock;
                return (
                  <li key={p.p_id} className={cn("flex flex-col justify-between rounded-2xl border p-4 transition-shadow hover:shadow-md", inCart ? "border-indigo-300 bg-indigo-50/40" : "border-slate-200 bg-white")}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-slate-900">{p.p_name}</p>
                        {inCart > 0 && <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">×{inCart}</span>}
                      </div>
                      {p.category && <div className="mt-1.5"><Pill tone="indigo">{p.category.name}</Pill></div>}
                    </div>
                    <div className="mt-4">
                      <div className="mb-2.5 flex items-baseline justify-between">
                        <span className="text-lg font-bold tabular-nums text-slate-900">{fmt(Number(p.p_price))}</span>
                        <span className={cn("text-xs font-medium", out ? "text-rose-600" : stock <= (p.reorder_level ?? 10) ? "text-amber-600" : "text-slate-500")}>
                          {out ? "Out of stock" : `${stock} in stock`}
                        </span>
                      </div>
                      <button onClick={() => setQty(p, inCart + 1)} disabled={out || maxed} aria-label={`Add ${p.p_name}`}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                        <Plus className="h-4 w-4" /> {maxed && !out ? "All in cart" : "Add"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* ---------- cart ---------- */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:col-span-2 lg:self-start">
          <Panel title="Current sale" subtitle={units ? `${units} item${units === 1 ? "" : "s"}` : undefined}
            action={lines.length > 0 && <button onClick={() => setCart({})} className="text-xs font-medium text-slate-500 hover:text-rose-600">Clear</button>}>
            {lines.length === 0 ? (
              <div className="grid place-items-center gap-2 py-10 text-center text-sm text-slate-500">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ShoppingCart className="h-6 w-6" /></span>
                Nothing added yet. Press <strong className="text-slate-700">Add</strong> on a product.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {lines.map(({ p, qty }) => (
                  <li key={p.p_id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{p.p_name}</p>
                      <p className="text-xs text-slate-500 tabular-nums">{fmt(Number(p.p_price))} each</p>
                    </div>
                    <div className="inline-flex items-center rounded-lg border border-slate-200">
                      <button aria-label={`Decrease ${p.p_name}`} onClick={() => setQty(p, qty - 1)} className="grid h-8 w-8 place-items-center rounded-l-lg hover:bg-slate-50"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
                      <button aria-label={`Increase ${p.p_name}`} onClick={() => setQty(p, qty + 1)} disabled={qty >= stockOf(p)} className="grid h-8 w-8 place-items-center rounded-r-lg hover:bg-slate-50 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <span className="w-20 text-right text-sm font-semibold tabular-nums text-slate-900">{fmt(qty * Number(p.p_price))}</span>
                    <button aria-label={`Remove ${p.p_name}`} onClick={() => setQty(p, 0)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-baseline justify-between"><span className="text-sm text-slate-500">Total</span><span className="text-3xl font-bold tracking-tight tabular-nums text-slate-900">{fmt(total)}</span></div>
              <button onClick={checkout} disabled={busy || lines.length === 0}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-95 disabled:opacity-50">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Complete sale
              </button>
            </div>
          </Panel>

          {result && (
            <div role="status" className={cn("fade-up flex items-start gap-3 rounded-2xl border p-4 text-sm", result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800")}>
              {result.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" />}
              <p className="font-semibold">{result.text}</p>
            </div>
          )}
        </div>
      </div>

      <CsvImporter<SaleCsvRow>
        open={csvOpen} onOpenChange={setCsvOpen}
        title="Import sales from CSV"
        description="Record many sales at once, for example from a spreadsheet. Stock is reduced for each sale. Nothing is saved if any row has a problem."
        columnsHint="product, quantity, date (optional)"
        required={[{ label: "product", anyOf: ["product", "productname", "name", "item", "pname"] }, { label: "quantity", anyOf: ["quantity", "qty", "units"] }]}
        sampleUrl="/samples/sample-sales.csv"
        parse={parseSales}
        preview={[
          { header: "Product", cell: (r) => r.name },
          { header: "Qty", cell: (r) => r.quantity },
          { header: "Date", cell: (r) => r.date ?? "today" },
        ]}
        importLabel={(n) => `Import ${n} sale${n === 1 ? "" : "s"}`}
        onImport={async (rows) => {
          const r = await postSalesBatch(rows.map((x) => ({ p_id: x.p_id, quantity: x.quantity, date: x.date })));
          load();
          return `Imported ${r.lines} sale${r.lines === 1 ? "" : "s"} (${r.units} units, ${fmt(r.total)}).`;
        }}
      />
    </div>
  );
}
