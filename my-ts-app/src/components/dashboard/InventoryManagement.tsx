import { useEffect, useState } from "react";
import { ArchiveX, Boxes, PackageCheck, ShoppingCart, Trash2 } from "lucide-react";
import { getMyInventory, postexpire } from "@/services/inventoryService";
import { getMyProducts } from "@/services/productService";
import { getOverview, getInventoryAnalytics, type InventoryAnalytics } from "@/services/overviewService";
import { StockVsReorder, DaysOfCover, StockFlow, ValueDonut, WasteBars } from "./charts";
import { errorText } from "@/lib/session";
import { PageHeader, Panel, StatCard, Pill, Empty, ErrorBox, th, td } from "./kit";

interface InvRow { p_id: number; p_name: string; total_import: number | string; quantity_sold: number | string; quantity_expired: number | string }

export const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InvRow[]>([]);
  const [stockById, setStockById] = useState<Record<number, { qty: number; reorder: number }>>({});
  const [levels, setLevels] = useState<{ p_id: number; name: string; qty: number; reorder: number }[]>([]);
  const [extra, setExtra] = useState<InventoryAnalytics | null>(null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;   // ignore a slow older answer if a newer load has started
    Promise.all([
      getInventoryAnalytics(),
      getOverview(),                                  // only used for each product's stock vs reorder level
      getMyInventory(),
      getMyProducts(),                                // the real current stock comes from the stock table
    ]).then(([analytics, overview, inv, ps]: [InventoryAnalytics, { stock_levels: typeof levels }, InvRow[], { p_id: number; reorder_level?: number; Stock?: { s_quantity: number } | null }[]]) => {
      if (ignore) return;
      setExtra(analytics); setLevels(overview.stock_levels); setInventory(inv);
      setStockById(Object.fromEntries(ps.map((p) => [p.p_id, { qty: p.Stock?.s_quantity ?? 0, reorder: p.reorder_level ?? 10 }])));
      setError(""); setLoaded(true);
    }).catch((e) => { if (!ignore) setError(errorText(e, "Could not load the inventory.")); });
    return () => { ignore = true; };
  }, [reload]);

  const rows = inventory.map((r) => {
    const imp = Number(r.total_import), sold = Number(r.quantity_sold), exp = Number(r.quantity_expired);
    return { ...r, imp, sold, exp, left: stockById[r.p_id]?.qty ?? 0, reorder: stockById[r.p_id]?.reorder ?? 10, sellThrough: imp ? Math.round((sold / imp) * 100) : 0 };
  });
  const sum = (k: "imp" | "sold" | "exp" | "left") => rows.reduce((s, r) => s + r[k], 0);

  const expire = async (name: string) => {
    if (!window.confirm(`Write off ALL remaining "${name}" as damaged or unsellable? This cannot be undone.`)) return;
    try {
      const r = await postexpire({ p_name: name });
      setNotice({ ok: true, text: r?.message ?? `Wrote off ${name}.` });
      setReload((n) => n + 1);
    } catch (e) {
      setNotice({ ok: false, text: errorText(e, "Could not write that off.") });
    }
  };

  if (error && !loaded) return <ErrorBox message={error} onRetry={() => { setError(""); setReload((n) => n + 1); }} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Stock coming in, going out, and written off" />

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} The numbers below may be out of date.</p>}
      {notice && (
        <div role="status" className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {notice.text}<button onClick={() => setNotice(null)} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total imported" value={sum("imp").toLocaleString()} note="Units received" icon={Boxes} tone="emerald" />
        <StatCard label="Total sold" value={sum("sold").toLocaleString()} note="Units sold" icon={ShoppingCart} tone="indigo" />
        <StatCard label="Written off" value={sum("exp").toLocaleString()} note="Units written off" icon={ArchiveX} tone="rose" />
        <StatCard label="In stock now" value={sum("left").toLocaleString()} note="Current stock level" icon={PackageCheck} tone="sky" />
      </div>

      <Panel title="Is there enough stock?" subtitle="Blue = what you have. Red = the level where you should reorder. A blue bar shorter than its red bar needs restocking.">
        {levels.length === 0 ? <Empty>No products found</Empty> : <StockVsReorder rows={levels} />}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="How long will the stock last?" subtitle="Days left at the pace of the last 30 days. Red = under a week, orange = under two weeks, green = fine.">
          {!extra || extra.cover.every((r) => r.days === null) ? <Empty>No recent sales to measure</Empty> : <DaysOfCover rows={extra.cover} />}
        </Panel>
        <Panel title="Stock coming in and going out" subtitle="Each week for the last 12 weeks: delivered, sold, and written off">
          {extra ? <StockFlow rows={extra.flow} /> : <Empty>Loading…</Empty>}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Money sitting in stock" subtitle="What the stock on hand cost you, by type">
          {!extra || extra.value_by_category.length === 0 ? <Empty>No stock</Empty> : <ValueDonut rows={extra.value_by_category} />}
        </Panel>
        <Panel title="Write-off losses by product" subtitle="Cost of units written off, damaged or unsellable (all time)">
          {!extra || extra.waste.length === 0 ? <Empty>Nothing has been written off</Empty> : <WasteBars rows={extra.waste} />}
        </Panel>
      </div>

      <Panel title="All products" subtitle="What came in, what sold, and what is left. Use the bin icon to write off damaged or unsellable stock.">
        {rows.length === 0 ? <Empty>No products found</Empty> : (
          <div className="scroll-soft max-h-[520px] overflow-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className={th}>Product</th><th className={th}>Imported</th><th className={th}>Sold</th><th className={th}>Written off</th>
                  <th className={th}>In stock</th><th className={`${th} w-40`}>Sold so far</th><th className={`${th} text-right`}>Write off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p) => (
                  <tr key={p.p_id} className="transition-colors hover:bg-slate-50/70">
                    <td className={`${td} font-medium text-slate-900`}>{p.p_name}</td>
                    <td className={`${td} tabular-nums`}>{p.imp}</td><td className={`${td} tabular-nums`}>{p.sold}</td><td className={`${td} tabular-nums`}>{p.exp}</td>
                    <td className={td}><Pill tone={p.left <= p.reorder ? "red" : p.left <= p.reorder * 2 ? "amber" : "green"}>{p.left} left</Pill></td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, p.sellThrough)}%` }} /></div>
                        <span className="w-9 text-right text-xs tabular-nums text-slate-500">{p.sellThrough}%</span>
                      </div>
                    </td>
                    <td className={`${td} text-right`}>
                      <button onClick={() => expire(p.p_name)} aria-label={`Write off ${p.p_name}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
