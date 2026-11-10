import { ChevronDown } from "lucide-react";
import { DatePicker } from "./DatePicker";
import { ALL_TIME_FROM, describePeriod } from "@/lib/period";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86400000));

const PRESETS = [
  { label: "7 days", from: () => daysAgo(6) },
  { label: "30 days", from: () => daysAgo(29) },
  { label: "90 days", from: () => daysAgo(89) },
  { label: "This month", from: () => iso(new Date()).slice(0, 8) + "01" },
  { label: "All time", from: () => ALL_TIME_FROM },
];

interface Props {
  products: { p_id: number; p_name: string; category_id: number | null }[];
  productId: number | null;
  onProduct: (id: number | null) => void;
  categories: { category_id: number; name: string }[];
  categoryId: number | null;
  onCategory: (id: number | null) => void;
  from: string;
  to: string;
  firstSale: string | null;   // earliest sale date, used to build the Year list
  onChange: (from: string, to: string) => void;
}

/** "Period" bar: Year + Month dropdowns, From / To calendars, and quick presets. */
export function PeriodFilter({ from, to, firstSale, onChange, products, productId, onProduct, categories, categoryId, onCategory }: Props) {
  const today = daysAgo(0);
  // what is highlighted is worked out from the dates actually in use, so the bar can never disagree with the data
  const { preset, year, month } = describePeriod(from, to, today);
  const thisYear = new Date().getFullYear();
  const firstYear = firstSale ? +firstSale.slice(0, 4) : thisYear;
  const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => thisYear - i);

  const applyYearMonth = (y: string, m: string) => {
    if (!y) return onChange(ALL_TIME_FROM, today);
    const Y = +y;
    if (!m) return onChange(`${Y}-01-01`, `${Y}-12-31`);
    const M = +m;
    onChange(`${Y}-${pad(M)}-01`, `${Y}-${pad(M)}-${pad(new Date(Y, M, 0).getDate())}`);
  };
  const pickPreset = (p: (typeof PRESETS)[number]) => {
    onChange(p.from(), today);
  };
  // choosing a day in a calendar = custom range; keep From <= To
  const customFrom = (v: string) => onChange(v, v > to ? v : to);
  const customTo = (v: string) => onChange(v < from ? v : from, v);

  const pill = "flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm";
  const custom = !year && !preset;
  const yearBlank = custom ? "Custom range" : preset && preset !== "All time" ? "Any year" : "All years";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-slate-500">Period</span>

        <label className={`${pill} relative`}>
          <span className="text-slate-500">Year</span>
          <select aria-label="Year" value={year} onChange={(e) => applyYearMonth(e.target.value, "")}
            className="cursor-pointer appearance-none bg-transparent pr-5 font-semibold text-slate-900 outline-none">
            <option value="">{yearBlank}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
        </label>

        <label className={`${pill} relative ${year ? "" : "opacity-60"}`}>
          <span className="text-slate-500">Month</span>
          <select aria-label="Month" value={month} disabled={!year} onChange={(e) => applyYearMonth(year, e.target.value)}
            className="cursor-pointer appearance-none bg-transparent pr-5 font-semibold text-slate-900 outline-none">
            <option value="">All months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
        </label>

        <span className="h-6 w-px bg-slate-300" />
        {/* "All time" really starts at your first sale, so show that date instead of the placeholder 01 Jan 2000 */}
        <DatePicker label="From" value={preset === "All time" && firstSale ? firstSale : from} onChange={customFrom} max={today} />
        <span className="text-sm text-slate-500">to</span>
        <DatePicker label="To" value={to} onChange={customTo} max={today} />

        <span className="h-6 w-px bg-slate-300" />
        <label className={`${pill} relative ${categoryId ? "border-indigo-400 ring-4 ring-indigo-50" : ""}`}>
          <span className="text-slate-500">Type</span>
          <select aria-label="Type" value={categoryId ?? ""} onChange={(e) => onCategory(e.target.value ? Number(e.target.value) : null)}
            className="max-w-[9rem] cursor-pointer appearance-none truncate bg-transparent pr-5 font-semibold text-slate-900 outline-none">
            <option value="">All types</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
        </label>
        <label className={`${pill} relative ${productId ? "border-indigo-400 ring-4 ring-indigo-50" : ""}`}>
          <span className="text-slate-500">Product</span>
          <select aria-label="Product" value={productId ?? ""} onChange={(e) => onProduct(e.target.value ? Number(e.target.value) : null)}
            className="max-w-[12rem] cursor-pointer appearance-none truncate bg-transparent pr-5 font-semibold text-slate-900 outline-none">
            <option value="">{categoryId ? "All in this type" : "All products"}</option>
            {[...products].filter((p) => !categoryId || p.category_id === categoryId).sort((a, b) => a.p_name.localeCompare(b.p_name)).map((p) => <option key={p.p_id} value={p.p_id}>{p.p_name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
        </label>
        {(productId || categoryId) && (
          <button onClick={() => { onProduct(null); onCategory(null); }} className="text-xs font-medium text-indigo-600 hover:underline">Clear</button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-[3.6rem]">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => pickPreset(p)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${preset === p.label ? "border-indigo-600 bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
