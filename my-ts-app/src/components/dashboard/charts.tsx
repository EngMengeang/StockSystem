import { useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { PieChart } from "@mui/x-charts/PieChart";
import type { InventoryAnalytics, OverviewData } from "@/services/overviewService";
import { COLORS, CHART_SX, Segmented, money, compact } from "./kit";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`;

/** Revenue / profit / orders over time, with the previous period behind it for comparison. */
export function TrendChart({ daily }: { daily: OverviewData["daily"] }) {
  const [metric, setMetric] = useState<"revenue" | "profit" | "orders">("revenue");
  const values = daily.map((d) => d[metric]);
  const hasPrev = metric === "revenue" && daily.some((d) => d.prev_revenue !== null);
  return (
    <div>
      <div className="mb-3"><Segmented value={metric} onChange={setMetric} options={[{ id: "revenue", label: "Sales" }, { id: "profit", label: "Profit" }, { id: "orders", label: "Number of sales" }]} /></div>
      <LineChart
        xAxis={[{ data: daily.map((d) => d.day), scaleType: "point" }]}
        yAxis={[{ width: 56, valueFormatter: metric === "orders" ? undefined : compact }]}
        series={[
          { id: "main", data: values, label: metric === "orders" ? "Number of sales" : `${metric === "revenue" ? "Sales" : "Profit"} ($)`, color: COLORS.indigo, area: true, showMark: false },
          ...(hasPrev ? [{ id: "prev", data: daily.map((d) => d.prev_revenue), label: "Period before", color: COLORS.slate, showMark: false }] : []),
        ]}
        height={330}
        sx={{ ...CHART_SX, "& .MuiAreaElement-root": { fillOpacity: 0.1 }, "& .MuiLineElement-series-prev": { strokeDasharray: "6 5" } }}
      />
    </div>
  );
}

/** Revenue and profit side by side for each category. */
export function CategoryBars({ rows }: { rows: OverviewData["by_category"] }) {
  return (
    <BarChart
      xAxis={[{ scaleType: "band", data: rows.map((r) => r.category) }]}
      yAxis={[{ width: 56, valueFormatter: compact }]}
      series={[
        { data: rows.map((r) => Math.round(r.revenue)), label: "Sales ($)", color: COLORS.indigo },
        { data: rows.map((r) => Math.round(r.profit)), label: "Profit ($)", color: COLORS.emerald },
      ]}
      height={280}
      grid={{ horizontal: true }}
      sx={CHART_SX}
    />
  );
}

/** Simple ranking: the 10 products that bring in the most money, longest bar first, with the dollar amount on each bar. */
export function TopProductsBars({ products }: { products: OverviewData["products"] }) {
  const top = products.slice(0, 10);   // products arrive sorted by sales, biggest first
  return (
    <BarChart
      layout="horizontal"
      yAxis={[{ scaleType: "band", data: top.map((p) => p.name), width: 150 }]}
      xAxis={[{ valueFormatter: compact }]}
      series={[{ data: top.map((p) => Math.round(p.revenue)), label: "Sales ($)", color: COLORS.indigo }]}
      barLabel={(item) => `$${(item.value ?? 0).toLocaleString("en-US")}`}
      height={Math.max(280, top.length * 38 + 40)}
      hideLegend
      sx={{ ...CHART_SX, "& .MuiBarLabel-root": { fill: "#ffffff", fontWeight: 600, fontSize: 12 } }}
    />
  );
}

/** Each dot is a product: further right = more revenue, higher = better margin. */
export function MarginScatter({ products }: { products: OverviewData["products"] }) {
  const pts = products.filter((p) => p.revenue > 0).map((p) => ({ x: Math.round(p.revenue), y: +((p.profit / p.revenue) * 100).toFixed(1), id: p.name }));
  return (
    <ScatterChart
      series={[{ label: "Products", data: pts, color: COLORS.violet, valueFormatter: (v, { dataIndex }) => `${pts[dataIndex].id}: ${money(v!.x)} sales, ${v!.y}% profit` }]}
      xAxis={[{ label: "Sales ($)", valueFormatter: compact }]}
      yAxis={[{ label: "Profit on each sale (%)" }]}
      height={320}
      grid={{ horizontal: true, vertical: true }}
      sx={CHART_SX}
    />
  );
}

/** Weekday x hour heat grid: darker = more revenue. */
export function HeatGrid({ cells }: { cells: OverviewData["heatmap"] }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 6);
  const map = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c.revenue]));
  const max = Math.max(1, ...cells.map((c) => c.revenue));
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid items-center gap-1" style={{ gridTemplateColumns: `38px repeat(${hours.length}, minmax(0,1fr))` }}>
          <span />
          {hours.map((h) => <span key={h} className="text-center text-[11px] text-slate-400">{hourLabel(h)}</span>)}
          {order.map((d) => (
            <div key={d} className="contents">
              <span className="text-xs font-medium text-slate-500">{DOW[d]}</span>
              {hours.map((h) => {
                const v = map.get(`${d}-${h}`) ?? 0;
                const t = v / max;
                return <div key={h} title={`${DOW[d]} ${hourLabel(h)}: ${money(v)}`} className="aspect-[1.5] rounded-md"
                  style={{ background: `rgba(79,70,229,${v ? 0.1 + 0.9 * t : 0.04})` }} />;
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-slate-400">
          Less {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => <span key={o} className="h-3 w-6 rounded" style={{ background: `rgba(79,70,229,${o})` }} />)} More sales
        </div>
      </div>
    </div>
  );
}

/** Current stock of each product next to its reorder level. */
export function StockVsReorder({ rows }: { rows: OverviewData["stock_levels"] }) {
  return (
    <BarChart
      xAxis={[{ scaleType: "band", data: rows.map((r) => r.name), tickLabelStyle: { angle: -35, textAnchor: "end", fontSize: 11 }, height: 90 }]}
      series={[
        { data: rows.map((r) => r.qty), label: "In stock", color: COLORS.indigo },
        { data: rows.map((r) => r.reorder), label: "Reorder level", color: COLORS.rose },
      ]}
      height={320}
      grid={{ horizontal: true }}
      sx={CHART_SX}
    />
  );
}

/** Profit margin (%) per day/week: is profitability improving or slipping? */
export function MarginTrend({ daily }: { daily: OverviewData["daily"] }) {
  const margins = daily.map((d) => (d.revenue ? +((d.profit / d.revenue) * 100).toFixed(1) : null));
  return (
    <LineChart
      xAxis={[{ data: daily.map((d) => d.day), scaleType: "point" }]}
      yAxis={[{ valueFormatter: (v: number) => `${v}%` }]}
      series={[{ data: margins, label: "Profit margin (%)", color: COLORS.emerald, showMark: false, curve: "natural", valueFormatter: (v) => (v === null ? "" : `${v}%`) }]}
      height={280}
      grid={{ horizontal: true }}
      sx={CHART_SX}
    />
  );
}

/** Which types make up sales, and how the mix shifts over time (stacked). */
export function CategoryMix({ trend, days }: { trend: OverviewData["category_trend"]; days: string[] }) {
  const cats = [...new Set(trend.map((t) => t.category))];
  const palette = [COLORS.indigo, COLORS.emerald, COLORS.amber, COLORS.rose, COLORS.sky, COLORS.violet, COLORS.slate];
  const lookup = new Map(trend.map((t) => [`${t.day}|${t.category}`, t.revenue]));
  return (
    <BarChart
      xAxis={[{ scaleType: "band", data: days }]}
      yAxis={[{ width: 56, valueFormatter: compact }]}
      series={cats.map((c, i) => ({ data: days.map((d) => Math.round(lookup.get(`${d}|${c}`) ?? 0)), label: c, stack: "mix", color: palette[i % palette.length] }))}
      height={300}
      sx={CHART_SX}
    />
  );
}

/** Last 12 months: sales and profit. */
export function MonthlyBars({ all }: { all: OverviewData["monthly"] }) {
  // skip the empty months before the first sale, but always show at least 3
  const first = all.findIndex((r) => r.revenue > 0 || r.profit > 0);
  const rows = all.slice(Math.min(first < 0 ? 0 : first, Math.max(0, all.length - 3)));
  return (
    <BarChart
      xAxis={[{ scaleType: "band", data: rows.map((r) => r.label) }]}
      yAxis={[{ width: 56, valueFormatter: compact }]}
      series={[
        { data: rows.map((r) => Math.round(r.revenue)), label: "Sales ($)", color: COLORS.indigo },
        { data: rows.map((r) => Math.round(r.profit)), label: "Profit ($)", color: COLORS.emerald },
      ]}
      height={300}
      grid={{ horizontal: true }}
      sx={CHART_SX}
    />
  );
}

/** From sales to take-home profit: what the items cost and what was written off along the way. */
export function ProfitWaterfall({ revenue, cogs, waste }: { revenue: number; cogs: number; waste: number }) {
  const gross = revenue - cogs;
  const net = gross - waste;
  const labels = ["Sales", "Item cost", "Gross profit", "Write-offs", "Net profit"];
  // invisible base lifts each floating bar to where it belongs
  const base = [0, revenue - cogs, 0, net, 0].map(Math.round);
  const total = [revenue, 0, gross, 0, net].map(Math.round);
  const loss = [0, cogs, 0, waste, 0].map(Math.round);
  return (
    <BarChart
      xAxis={[{ scaleType: "band", data: labels }]}
      series={[
        { data: base, stack: "w", color: "transparent", label: "", valueFormatter: () => null },
        { data: total, stack: "w", label: "Total ($)", color: COLORS.indigo, valueFormatter: (v) => (v ? `$${v}` : null) },
        { data: loss, stack: "w", label: "Taken off ($)", color: COLORS.rose, valueFormatter: (v) => (v ? `-$${v}` : null) },
      ]}
      height={300}
      grid={{ horizontal: true }}
      yAxis={[{ width: 56, valueFormatter: compact }]}
      slotProps={{ legend: { hidden: true } as never }}
      sx={CHART_SX}
    />
  );
}

/** Round progress dial. */
export function Dial({ value, label, color, caption }: { value: number; label: string; color: string; caption?: string }) {
  return (
    <div className="flex flex-col items-center">
      <Gauge value={Math.max(0, Math.min(100, value))} valueMin={0} valueMax={100} width={150} height={110} startAngle={-110} endAngle={110} cornerRadius="50%"
        text={`${Math.round(value)}%`}
        sx={{ [`& .${gaugeClasses.valueArc}`]: { fill: color }, [`& .${gaugeClasses.referenceArc}`]: { fill: "#eef1f6" },
          [`& .${gaugeClasses.valueText}`]: { fontSize: 22, fontWeight: 700, fontFamily: "Inter, sans-serif" } }} />
      <p className="-mt-1 text-sm font-semibold text-slate-800">{label}</p>
      {caption && <p className="text-xs text-slate-500">{caption}</p>}
    </div>
  );
}

/** Days of stock left at the current pace. Red = under a week, orange = under two. */
export function DaysOfCover({ rows }: { rows: InventoryAnalytics["cover"] }) {
  const items = rows.filter((r) => r.days !== null).sort((a, b) => (a.days as number) - (b.days as number)).slice(0, 12);
  const cap = (d: number) => Math.min(d, 60);
  return (
    <BarChart
      layout="horizontal"
      yAxis={[{ scaleType: "band", data: items.map((r) => r.name), width: 140 }]}
      xAxis={[{ min: 0, max: 60, label: "Days of stock left (up to 60)",
        colorMap: { type: "piecewise", thresholds: [7, 14], colors: [COLORS.rose, COLORS.amber, COLORS.emerald] } }]}
      series={[{ data: items.map((r) => +cap(r.days as number).toFixed(1)), label: "Days left" }]}
      height={Math.max(260, items.length * 30 + 60)}
      grid={{ vertical: true }}
      sx={CHART_SX}
    />
  );
}

/** Weekly stock flow: delivered, sold, written off. */
export function StockFlow({ rows }: { rows: InventoryAnalytics["flow"] }) {
  return (
    <LineChart
      xAxis={[{ data: rows.map((r) => r.week), scaleType: "point" }]}
      series={[
        { data: rows.map((r) => r.delivered), label: "Delivered", color: COLORS.emerald, showMark: true },
        { data: rows.map((r) => r.sold), label: "Sold", color: COLORS.indigo, showMark: true },
        { data: rows.map((r) => r.expired), label: "Written off", color: COLORS.rose, showMark: true },
      ]}
      height={300}
      grid={{ horizontal: true }}
      sx={CHART_SX}
    />
  );
}

/** Where the money in stock sits, by type. */
export function ValueDonut({ rows }: { rows: InventoryAnalytics["value_by_category"] }) {
  return (
    <PieChart
      series={[{ data: rows.map((r, i) => ({ id: i, value: Math.round(r.value), label: r.category })), innerRadius: 55, outerRadius: 105, paddingAngle: 2, cornerRadius: 5 }]}
      colors={[COLORS.indigo, COLORS.emerald, COLORS.amber, COLORS.rose, COLORS.sky, COLORS.violet, COLORS.slate]}
      height={290}
      slotProps={{ legend: { direction: "horizontal", position: { vertical: "bottom", horizontal: "center" } } }}
      sx={CHART_SX}
    />
  );
}

/** Money lost to written-off stock, by product. */
export function WasteBars({ rows }: { rows: InventoryAnalytics["waste"] }) {
  return (
    <BarChart
      layout="horizontal"
      yAxis={[{ scaleType: "band", data: rows.map((r) => r.name), width: 140 }]}
      series={[{ data: rows.map((r) => +r.loss.toFixed(2)), label: "Loss ($)", color: COLORS.rose }]}
      height={Math.max(240, rows.length * 34 + 50)}
      sx={CHART_SX}
    />
  );
}
