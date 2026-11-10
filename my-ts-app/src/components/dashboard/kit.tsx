/* eslint-disable react-refresh/only-export-components -- these files also export small helpers next to components; that only affects hot-reload while developing */
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { cn } from "@/lib/utils";

/** Shared chart colours (one hue per meaning, used the same way on every page). */
export const COLORS = {
  indigo: "#6366f1", emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e", sky: "#0ea5e9", violet: "#8b5cf6", slate: "#94a3b8",
};

/** Make MUI charts use the page font and softer grid lines. */
export const CHART_SX = {
  '& text': { fontFamily: 'Inter, system-ui, sans-serif !important' },
  '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: '#e2e8f0' },
  '& .MuiChartsGrid-line': { stroke: '#eef1f6' },
};

// small number helpers live in lib/format.ts (so they can be unit-tested without loading the charts)
export { compact, money } from "@/lib/format";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="fade-up flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/** White rounded card with an optional title row. */
export function Panel({ title, subtitle, action, children, className, pad = true }: {
  title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean;
}) {
  return (
    <section className={cn("fade-up rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

const TONES = {
  indigo: "bg-indigo-50 text-indigo-600", emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600", sky: "bg-sky-50 text-sky-600", violet: "bg-violet-50 text-violet-600",
} as const;
export type Tone = keyof typeof TONES;
const SPARK: Record<Tone, string> = { indigo: "#6366f1", emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e", sky: "#0ea5e9", violet: "#8b5cf6" };

/** KPI tile: tinted icon, big number, small note. */
export function StatCard({ label, value, note, icon: Icon, tone = "indigo", noteClass = "text-slate-500", spark }: {
  label: string; value: ReactNode; note?: ReactNode; icon: LucideIcon; tone?: Tone; noteClass?: string; spark?: number[];
}) {
  return (
    <div className="fade-up rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", TONES[tone])}><Icon className="h-5 w-5" /></span>
      </div>
      {note && <p className={cn("mt-3 text-xs font-medium", noteClass)}>{note}</p>}
      {spark && spark.length > 1 && (
        <div className="mt-3 -mx-1">
          <SparkLineChart data={spark} height={36} curve="natural" area showHighlight={false}
            color={SPARK[tone]} sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 } }} />
        </div>
      )}
    </div>
  );
}

/** Small coloured status pill. */
export function Pill({ tone = "slate", children }: { tone?: "slate" | "green" | "amber" | "red" | "indigo"; children: ReactNode }) {
  const t = {
    slate: "bg-slate-100 text-slate-600", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700", indigo: "bg-indigo-50 text-indigo-700",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", t)}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 py-12 text-sm text-slate-500">{children}</div>;
}

/** Table look shared by all pages. */
export const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
export const td = "px-4 py-3 text-sm text-slate-700";

/** Pill-style tab switcher. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} onClick={() => onChange(o.id)}
          className={cn("rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
            value === o.id ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}


/** Friendly error with a Try again button (used when a page cannot load its data). */
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-10 max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
      <p className="text-sm font-semibold text-rose-800">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex h-9 items-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700">
          Try again
        </button>
      )}
    </div>
  );
}
