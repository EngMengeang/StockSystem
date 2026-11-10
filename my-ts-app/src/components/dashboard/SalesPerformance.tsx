import { DollarSign, ReceiptText, ShoppingCart, Wallet, Lightbulb } from "lucide-react";
import { useOverview } from "@/hooks/useOverview";
import { PageHeader, Panel, StatCard, Empty, ErrorBox, th, td, money } from "./kit";
import { PeriodFilter } from "./PeriodFilter";
import { CategoryMix, HeatGrid, MarginScatter, TopProductsBars } from "./charts";

const DAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

export const SalesPerformance = () => {
  const { data, error, loading, from, to, productId, setProductId, categoryId, setCategoryId, categories, products, setRange, retry } = useOverview();

  if (error && !data) return <ErrorBox message={error} onRetry={retry} />;
  if (!data) return <p className="p-6 text-sm text-slate-500">Loading…</p>;

  const { totals, range, products: stats } = data;
  const aov = totals.orders ? totals.revenue / totals.orders : 0;
  const margin = totals.revenue ? (totals.profit / totals.revenue) * 100 : 0;
  const total = stats.reduce((s, p) => s + p.revenue, 0) || 1;

  const topShare = (stats.slice(0, 10).reduce((s, p) => s + p.revenue, 0) / total) * 100;

  // plain-language findings computed from the numbers
  let run = 0;
  const to80 = stats.findIndex((p) => (run += p.revenue) / total >= 0.8) + 1 || stats.length;
  const bestDay = [...data.by_weekday].sort((a, b) => b.revenue - a.revenue)[0];
  const bestSlot = [...data.heatmap].sort((a, b) => b.revenue - a.revenue)[0];
  const bestMargin = [...stats].filter((p) => p.revenue > 0).sort((a, b) => b.profit / b.revenue - a.profit / a.revenue)[0];
  const insights = [
    stats.length ? `${to80} of ${stats.length} products bring in 80% of your sales.` : "",
    bestDay ? `${DAYS[bestDay.dow]} are the best sales day (${money(bestDay.revenue)}).` : "",
    bestSlot ? `Busiest hour: ${bestSlot.hour % 12 || 12}${bestSlot.hour < 12 ? "am" : "pm"} on ${DAYS[bestSlot.dow]}.` : "",
    bestMargin ? `${bestMargin.name} has the best profit margin at ${((bestMargin.profit / bestMargin.revenue) * 100).toFixed(0)}%.` : "",
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <PageHeader title="Sales Performance" subtitle={`What sells, when it sells, and how profitable it is${loading ? " · updating…" : ""}`} />
        <PeriodFilter products={products} productId={productId} onProduct={setProductId} categories={categories} categoryId={categoryId} onCategory={setCategoryId} from={from} to={to} firstSale={range.first_sale} onChange={setRange} />
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} Showing the last numbers that loaded. <button onClick={retry} className="font-semibold underline">Try again</button></p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales" value={money(totals.revenue)} note={`${range.from} to ${range.to}`} icon={DollarSign} tone="indigo" />
        <StatCard label="Profit" value={money(totals.profit)} note={`${margin.toFixed(1)}% margin`} icon={Wallet} tone="emerald" />
        <StatCard label="Number of sales" value={totals.orders.toLocaleString()} note={`${totals.units.toLocaleString()} items sold`} icon={ShoppingCart} tone="violet" />
        <StatCard label="Average sale" value={`$${aov.toFixed(2)}`} note="Money per sale" icon={ReceiptText} tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Which products sell the most?" subtitle={`Your top ${Math.min(10, stats.length)} products by sales in this period. The longer the bar, the more money it brought in.`}>
          {stats.length === 0 ? <Empty>No sales in this period</Empty> : (
            <>
              <TopProductsBars products={stats} />
              <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                These {Math.min(10, stats.length)} products make <strong className="text-slate-900">{topShare.toFixed(0)}%</strong> of all your sales.
              </p>
            </>
          )}
        </Panel>
        <Panel title="Quick facts" subtitle="Worked out from this period"
          action={<span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><Lightbulb className="h-4 w-4" /></span>}>
          {insights.length === 0 ? <Empty>No sales in this period</Empty> : (
            <ul className="space-y-3">
              {insights.map((t) => (
                <li key={t} className="flex gap-3 rounded-xl bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />{t}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="When do customers buy?" subtitle="Darker = more sales. Shows the busiest days and hours.">
        {data.heatmap.length === 0 ? <Empty>No sales in this period</Empty> : <HeatGrid cells={data.heatmap} />}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Which products earn well?" subtitle="Each dot is a product. Further right = more sales. Higher up = more profit on each sale.">
          {stats.length === 0 ? <Empty>No sales in this period</Empty> : <MarginScatter products={stats} />}
        </Panel>
        <Panel title="What kinds of products are selling?" subtitle="Sales by type, over time">
          {data.category_trend.length === 0 ? <Empty>No sales in this period</Empty> : <CategoryMix trend={data.category_trend} days={data.daily.map((d) => d.day)} />}
        </Panel>
      </div>

      <Panel title="Every product" subtitle="Sales, profit and profit margin for each product">
        {stats.length === 0 ? <Empty>No sales in this period</Empty> : (
          <div className="scroll-soft max-h-[460px] overflow-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50">
                <tr><th className={th}>#</th><th className={th}>Product</th><th className={th}>Category</th><th className={th}>Sold</th><th className={th}>Sales</th><th className={th}>Profit</th><th className={th}>Profit %</th><th className={`${th} w-40`}>Share</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.map((p, i) => {
                  const m = p.revenue ? (p.profit / p.revenue) * 100 : 0;
                  return (
                    <tr key={p.p_id} className="transition-colors hover:bg-slate-50/70">
                      <td className={`${td} text-slate-400`}>{i + 1}</td>
                      <td className={`${td} font-medium text-slate-900`}>{p.name}</td>
                      <td className={td}>{p.category}</td>
                      <td className={`${td} tabular-nums`}>{p.units.toLocaleString()}</td>
                      <td className={`${td} tabular-nums`}>{money(p.revenue)}</td>
                      <td className={`${td} tabular-nums`}>{money(p.profit)}</td>
                      <td className={`${td} tabular-nums ${m < 25 ? "text-rose-600" : ""}`}>{m.toFixed(0)}%</td>
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(p.revenue / total) * 100}%` }} /></div>
                          <span className="w-10 text-right text-xs tabular-nums text-slate-500">{((p.revenue / total) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
