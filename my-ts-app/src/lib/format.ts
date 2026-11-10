/** 12500 -> "12.5k" (short labels for big money axes) */
export const compact = (v: number | null) => (v === null ? "" : Math.abs(v) >= 1000 ? `${+(v / 1000).toFixed(1)}k` : `${v}`);

/** 12500.4 -> "$12,500" */
export const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
