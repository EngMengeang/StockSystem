import { DollarSign, ShoppingCart, Package, AlertTriangle, Wallet } from "lucide-react";
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useOverview } from "@/hooks/useOverview";
import { PageHeader, Panel, StatCard, COLORS, CHART_SX, Empty, ErrorBox, money, compact } from "./kit";
import { PeriodFilter } from "./PeriodFilter";
import { TrendChart, CategoryBars, MarginTrend, MonthlyBars, ProfitWaterfall, Dial } from "./charts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Overview = () => {
  const { data, error, loading, from, to, productId, setProductId, categoryId, setCategoryId, categories, products, setRange, retry } = useOverview();

  if (error && !data) return <ErrorBox message={error} onRetry={retry} />;
  if (!data) return <p className="p-6 text-sm text-slate-500">Loading…</p>;

  const { totals, growth_pct, range } = data;
  const periodLabel = `${range.from} to ${range.to}`;
  const margin = totals.revenue ? (totals.profit / totals.revenue) * 100 : 0;
  const up = (growth_pct ?? 0) >= 0;
  // health dials
  const healthy = data.stock_levels.filter((r) => r.qty > r.reorder).length;
  const stockHealth = data.stock_levels.length ? (healthy / data.stock_levels.length) * 100 : 100;
  const wasteRate = totals.units + totals.expired_units ? (totals.expired_units / (totals.units + totals.expired_units)) * 100 : 0;
  const spark = (k: "revenue" | "profit" | "orders") => data.daily.map((d) => d[k]);
  const weekday = DAYS.map((_, d) => data.by_weekday.find((w) => w.dow === d)?.revenue ?? 0);

  const cards = [
    { label: "Sales", value: money(totals.revenue), icon: DollarSign, tone: "indigo" as const, spark: spark("revenue"),
      note: growth_pct === null ? "No earlier period to compare" : `${up ? "▲" : "▼"} ${Math.abs(growth_pct).toFixed(1)}% vs previous ${range.days} days`,
      noteClass: growth_pct === null ? "text-slate-500" : up ? "text-emerald-600" : "text-rose-600" },
    { label: "Profit", value: money(totals.profit), icon: Wallet, tone: "emerald" as const, spark: spark("profit"), note: `${margin.toFixed(1)}% profit margin` },
    { label: "Units sold", value: totals.units.toLocaleString(), icon: ShoppingCart, tone: "violet" as const, spark: spark("orders"), note: `${totals.orders.toLocaleString()} sales` },
    { label: "Inventory value", value: money(totals.stock_value), icon: Package, tone: "sky" as const,
      note: `What the stock on hand cost you · ${data.low_stock.length} running low`, noteClass: data.low_stock.length ? "text-amber-600" : "text-slate-500" },
    { label: "Write-off loss", value: money(totals.expired_loss), icon: AlertTriangle, tone: "amber" as const, note: `${totals.expired_units} units written off in this period` },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <PageHeader title="Dashboard Overview" subtitle={`${productId ? `Showing ${products.find((p) => p.p_id === productId)?.p_name ?? "product"} only` : categoryId ? `Showing ${categories.find((c) => c.category_id === categoryId)?.name ?? "type"} only` : "Sales, profit and stock at a glance"}${loading ? " · updating…" : ""}`} />
        <PeriodFilter products={products} productId={productId} onProduct={setProductId} categories={categories} categoryId={categoryId} onCategory={setCategoryId} from={from} to={to} firstSale={data.range.first_sale} onChange={setRange} />
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} Showing the last numbers that loaded. <button onClick={retry} className="font-semibold underline">Try again</button></p>}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* trend with previous-period comparison */}
      <Panel title="Sales over time" subtitle={`${periodLabel} · ${range.bucket === "week" ? "weekly" : "daily"} · dotted line = the period before, for comparison`}>
        <TrendChart daily={data.daily} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Profit margin" subtitle="How much of each sale you keep as profit. Going up is good.">
          <MarginTrend daily={data.daily} />
        </Panel>
        <Panel title="Health check" subtitle="Three things to keep an eye on">
          <div className="grid grid-cols-2 gap-x-2 gap-y-4">
            <Dial value={margin} label="Profit margin" color={COLORS.emerald} caption="Profit kept from each $100 sold" />
            <Dial value={stockHealth} label="Stock level" color={stockHealth >= 80 ? COLORS.indigo : COLORS.amber} caption={`${healthy} of ${data.stock_levels.length} products well stocked`} />
            <Dial value={wasteRate} label="Write-off rate" color={wasteRate > 5 ? COLORS.rose : COLORS.sky} caption="Share of items lost to damage or write-offs" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Sales by type" subtitle="Share of your sales">
          {data.by_category.length === 0 ? <Empty>No sales in this period</Empty> : (
            <PieChart
              series={[{
                data: data.by_category.map((c, i) => ({ id: i, value: Math.round(c.revenue), label: c.category })),
                innerRadius: 55, outerRadius: 100, paddingAngle: 2, cornerRadius: 5,
              }]}
              colors={[COLORS.indigo, COLORS.emerald, COLORS.amber, COLORS.rose, COLORS.sky, COLORS.violet, COLORS.slate]}
              height={280}
              slotProps={{ legend: { direction: "horizontal", position: { vertical: "bottom", horizontal: "center" } } }}
              sx={CHART_SX}
            />
          )}
        </Panel>
        <Panel className="lg:col-span-2" title="Sales and profit by type" subtitle="Which types of products earn the most">
          {data.by_category.length === 0 ? <Empty>No sales in this period</Empty> : <CategoryBars rows={data.by_category} />}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Last 12 months" subtitle="Sales and profit for each month (not affected by the dates above)">
          <MonthlyBars all={data.monthly} />
        </Panel>
        <Panel title="Where the money goes" subtitle="From sales to profit you keep">
          <ProfitWaterfall revenue={totals.revenue} cogs={totals.revenue - totals.profit} waste={totals.expired_loss} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Best sellers" subtitle="Top 5 products by sales">
          {data.top_products.length === 0 ? <Empty>No sales in this period</Empty> : (
            <BarChart
              layout="horizontal"
              yAxis={[{ scaleType: 'band', data: data.top_products.map((p) => p.name), width: 130 }]}
              xAxis={[{ valueFormatter: compact }]}
              series={[{ data: data.top_products.map((p) => Math.round(p.revenue)), label: 'Sales ($)', color: COLORS.indigo }]}
              height={260}
              sx={CHART_SX}
            />
          )}
        </Panel>

        <Panel title="Busiest days" subtitle="Sales for each day of the week">
          <BarChart
            xAxis={[{ scaleType: 'band', data: DAYS }]}
            yAxis={[{ width: 56, valueFormatter: compact }]}
            series={[{ data: weekday.map(Math.round), label: 'Sales ($)', color: COLORS.violet }]}
            height={260}
            sx={CHART_SX}
          />
        </Panel>

        <Panel title="Running low" subtitle="Products to restock soon"
          action={<span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle className="h-4 w-4" /></span>}>
          {data.low_stock.length === 0 ? (
            <Empty>All products are well stocked</Empty>
          ) : (
            <ul className="space-y-2.5">
              {data.low_stock.map((item) => (
                <li key={item.p_id} className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/60 px-3.5 py-2.5">
                  <span className="text-sm font-medium text-slate-800">{item.p_name}</span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-rose-600 shadow-sm">{item.s_quantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};
