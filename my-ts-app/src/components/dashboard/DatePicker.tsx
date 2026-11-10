/* eslint-disable react-refresh/only-export-components -- these files also export small helpers next to components; that only affects hot-reload while developing */
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** "2026-01-05" -> "05 Jan 2026" */
export const formatDate = (iso: string) => `${iso.slice(8, 10)} ${SHORT[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`;

interface Props {
  label: string;
  value: string;       // YYYY-MM-DD
  onChange: (iso: string) => void;
  max?: string;        // latest selectable day
}

/** A small calendar popover: click the field, pick a day. Month and year can be changed from the header. */
export function DatePicker({ label, value, onChange, max }: Props) {
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(+value.slice(0, 4));
  const [viewM, setViewM] = useState(+value.slice(5, 7) - 1);
  const box = useRef<HTMLDivElement>(null);

  // open on the month of the selected date
  useEffect(() => { if (open) { setViewY(+value.slice(0, 4)); setViewM(+value.slice(5, 7) - 1); } }, [open, value]);

  // close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);

  const first = new Date(viewY, viewM, 1).getDay();
  const count = new Date(viewY, viewM + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const step = (n: number) => {
    const d = new Date(viewY, viewM + n, 1);
    setViewY(d.getFullYear()); setViewM(d.getMonth());
  };
  const thisYear = new Date().getFullYear();
  // the list always contains the year being viewed (for example 2000), even if it is older than the usual range
  const firstYear = Math.min(2015, viewY);
  const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => thisYear - i);

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`${label} date: ${formatDate(value)}`} aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm hover:border-indigo-400">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-900">{formatDate(value)}</span>
        <CalendarDays className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-xl border bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-1">
            <button type="button" aria-label="Previous month" onClick={() => step(-1)} className="rounded-md p-1.5 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
            <div className="flex gap-1">
              <select aria-label="Month" value={viewM} onChange={(e) => setViewM(+e.target.value)} className="rounded-md border px-1.5 py-1 text-sm font-medium">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select aria-label="Year" value={viewY} onChange={(e) => setViewY(+e.target.value)} className="rounded-md border px-1.5 py-1 text-sm font-medium">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" aria-label="Next month" onClick={() => step(1)} className="rounded-md p-1.5 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-slate-500">
            {WEEK.map((w) => <span key={w} className="py-1">{w}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (d === null) return <span key={`b${i}`} />;
              const iso = toISO(viewY, viewM, d);
              const disabled = !!max && iso > max;
              const selected = iso === value;
              return (
                <button key={iso} type="button" disabled={disabled} onClick={() => { onChange(iso); setOpen(false); }}
                  className={`h-9 rounded-lg text-sm transition-colors ${selected ? "bg-indigo-600 font-semibold text-white" : "hover:bg-indigo-50"} ${disabled ? "cursor-not-allowed text-slate-300 hover:bg-transparent" : ""}`}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
