import { describe, expect, it } from "vitest";
import { describePeriod } from "./period";

const TODAY = "2026-11-10";

describe("describePeriod: the filter bar always matches the real date range", () => {
  it("recognises each quick button", () => {
    expect(describePeriod("2026-11-04", TODAY, TODAY).preset).toBe("7 days");
    expect(describePeriod("2026-10-12", TODAY, TODAY).preset).toBe("30 days");
    expect(describePeriod("2026-08-13", TODAY, TODAY).preset).toBe("90 days");
    expect(describePeriod("2026-11-01", TODAY, TODAY).preset).toBe("This month");
    expect(describePeriod("2000-01-01", TODAY, TODAY).preset).toBe("All time");
  });

  it("recognises a whole year and a whole month", () => {
    expect(describePeriod("2026-01-01", "2026-12-31", TODAY)).toEqual({ preset: "", year: "2026", month: "" });
    expect(describePeriod("2026-10-01", "2026-10-31", TODAY)).toEqual({ preset: "", year: "2026", month: "10" });
    expect(describePeriod("2024-02-01", "2024-02-29", TODAY)).toEqual({ preset: "", year: "2024", month: "2" });   // leap year
    expect(describePeriod("2025-02-01", "2025-02-28", TODAY)).toEqual({ preset: "", year: "2025", month: "2" });
  });

  it("treats anything else as a custom range (nothing highlighted)", () => {
    expect(describePeriod("2026-10-05", "2026-10-20", TODAY)).toEqual({ preset: "", year: "", month: "" });
    expect(describePeriod("2026-10-01", "2026-10-30", TODAY)).toEqual({ preset: "", year: "", month: "" });   // not the full month
    expect(describePeriod("2026-10-12", "2026-11-09", TODAY).preset).toBe("");                                 // 30 days but ends yesterday
  });

  it("works at month and year boundaries", () => {
    expect(describePeriod("2026-01-01", "2026-01-31", "2026-01-31").preset).toBe("This month");
    expect(describePeriod("2025-12-05", "2026-01-03", "2026-01-03").preset).toBe("30 days");
  });
});
