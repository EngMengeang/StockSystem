// Small input checks shared by the controllers. They never throw: they return a clean value or NaN/null.

/** whole number of 0 or more, from a number or a digits-only string, else NaN */
export const toInt = (v) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 ? v
  : typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v.trim())
  : NaN;

/** non-negative decimal from a number or a plain numeric string ("12", "12.50"), else NaN */
export const toMoney = (v) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v
  : typeof v === "string" && /^\d+(\.\d+)?$/.test(v.trim()) ? Number(v.trim())
  : NaN;

/** like toMoney, but also accepts what spreadsheets write: "$1,299.00" or "1 299" */
export const toMoneyLoose = (v) => {
  if (typeof v !== "string") return toMoney(v);
  return toMoney(v.replace(/[$\s]/g, "").replace(/,(?=\d{3}(\D|$))/g, ""));
};

/** trimmed text of 1..max characters, else null */
export const cleanText = (v, max) => (typeof v === "string" && v.trim() && v.trim().length <= max ? v.trim() : null);

/** a real calendar day written YYYY-MM-DD (rejects 2026-02-31) */
export const isRealDate = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  // an impossible date like 2026-13-01 gives an invalid Date (toISOString would throw), 2026-02-31 rolls over to March
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

export const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export const LIMITS = { price: 10_000_000, quantity: 1_000_000, name: 255, sku: 40, category: 80 };
