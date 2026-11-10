/* eslint-disable react-refresh/only-export-components -- a provider and its hook belong together */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const iso = (d: Date) => d.toISOString().slice(0, 10);
export const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86400000));

interface Filters {
  from: string;
  to: string;
  productId: number | null;
  categoryId: number | null;
  setRange: (from: string, to: string) => void;
  setProductId: (id: number | null) => void;
  setCategoryId: (id: number | null) => void;
}

const Ctx = createContext<Filters | null>(null);

/** Keeps the date range, product and type filters in one place so they stay the same when you switch between pages. */
export function FilterProvider({ children }: { children: ReactNode }) {
  const [range, setRangeState] = useState({ from: daysAgo(29), to: daysAgo(0) });
  const [productId, setProductId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const value = useMemo<Filters>(() => ({
    ...range, productId, categoryId, setProductId, setCategoryId,
    setRange: (from, to) => setRangeState({ from, to }),
  }), [range, productId, categoryId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters(): Filters {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFilters must be used inside <FilterProvider>");
  return v;
}
