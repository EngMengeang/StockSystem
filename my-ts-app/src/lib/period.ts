const pad = (n: number) => String(n).padStart(2, "0");
const addDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const ALL_TIME_FROM = "2000-01-01";

export interface PeriodState {
  /** which quick button matches the range ("" = none) */
  preset: string;
  /** a whole calendar year selected ("" = none) */
  year: string;
  /** a whole month of that year selected ("" = none) */
  month: string;
}

/**
 * Work out how the filter bar should LOOK for a given date range, so the buttons and dropdowns
 * always agree with the dates actually in use (for example after switching pages and coming back).
 */
export function describePeriod(from: string, to: string, today: string): PeriodState {
  if (to === today) {
    if (from === addDays(today, -6)) return { preset: "7 days", year: "", month: "" };
    if (from === addDays(today, -29)) return { preset: "30 days", year: "", month: "" };
    if (from === addDays(today, -89)) return { preset: "90 days", year: "", month: "" };
    if (from === `${today.slice(0, 8)}01`) return { preset: "This month", year: "", month: "" };
    if (from === ALL_TIME_FROM) return { preset: "All time", year: "", month: "" };
  }
  const y = Number(from.slice(0, 4)), m = Number(from.slice(5, 7));
  if (from === `${y}-01-01` && to === `${y}-12-31`) return { preset: "", year: String(y), month: "" };
  if (from === `${y}-${pad(m)}-01` && to === `${y}-${pad(m)}-${pad(lastDay(y, m))}`) return { preset: "", year: String(y), month: String(m) };
  return { preset: "", year: "", month: "" };
}
