import { describe, expect, it } from "vitest";
import { parseCsv, parseNumber, pick } from "./csv";
import { compact, money } from "./format";

describe("parseCsv", () => {
  it("reads a normal file into rows keyed by header", () => {
    const { headers, rows } = parseCsv("product,quantity,date\nAirPods 4,2,2026-11-01\niPhone 16,1,\n");
    expect(headers).toEqual(["product", "quantity", "date"]);
    expect(rows).toEqual([
      { product: "AirPods 4", quantity: "2", date: "2026-11-01" },
      { product: "iPhone 16", quantity: "1", date: "" },
    ]);
  });

  it('handles a quoted name containing an inch mark: "MacBook Air 13"""', () => {
    const { rows } = parseCsv('product,quantity\n"MacBook Air 13""",1\n');
    expect(rows[0].product).toBe('MacBook Air 13"');
  });

  it("keeps an UNquoted inch mark as plain text instead of breaking the row", () => {
    const { rows } = parseCsv('product,quantity\nMacBook Pro 14",2\niMac 24",1\n');
    expect(rows.map((r) => r.product)).toEqual(['MacBook Pro 14"', 'iMac 24"']);
    expect(rows.map((r) => r.quantity)).toEqual(["2", "1"]);
  });

  it("keeps commas that are inside quotes", () => {
    expect(parseCsv('name,price\n"Case, leather","1,299.00"\n').rows[0]).toEqual({ name: "Case, leather", price: "1,299.00" });
  });

  it("copes with Windows line endings, a BOM, blank lines and no final newline", () => {
    const { headers, rows } = parseCsv("﻿name,qty\r\nA,1\r\n\r\nB,2");
    expect(headers).toEqual(["name", "qty"]);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual({ name: "B", qty: "2" });
  });

  it("detects a semicolon-separated file (common in some regions)", () => {
    expect(parseCsv("name;qty\nA;3\n").rows[0]).toEqual({ name: "A", qty: "3" });
  });

  it('normalises headers like "Product Name" and "reorder_level"', () => {
    const { headers } = parseCsv("Product Name,Reorder_Level,Low-Stock\nx,1,2\n");
    expect(headers).toEqual(["productname", "reorderlevel", "lowstock"]);
  });

  it("gives empty strings for missing trailing cells and handles empty input", () => {
    expect(parseCsv("a,b,c\n1,2\n").rows[0]).toEqual({ a: "1", b: "2", c: "" });
    expect(parseCsv("")).toEqual({ headers: [], rows: [] });
    expect(parseCsv("a,b\n").rows).toEqual([]);
  });

  it("keeps a newline that is inside a quoted cell", () => {
    expect(parseCsv('a,b\n"line1\nline2",x\n').rows[0].a).toBe("line1\nline2");
  });
});

describe("pick", () => {
  it("returns the first non-empty column among the alternatives", () => {
    expect(pick({ qty: "", quantity: "5" }, "qty", "quantity")).toBe("5");
    expect(pick({}, "a", "b")).toBe("");
  });
});

describe("parseNumber (spreadsheet-style numbers)", () => {
  it.each([
    ["1299", 1299], ["1299.50", 1299.5], ["1,299", 1299], ["1,299.50", 1299.5], ["$1,299.00", 1299], [" 12 ", 12], ["$0", 0], ["1,234,567.89", 1234567.89],
  ])("accepts %s", (input, expected) => expect(parseNumber(input)).toBe(expected));

  it.each(["", "abc", "12,5", "1,2,3", "-5", "1.2.3", "1e3", "12abc", "$", "NaN", "Infinity", "1,29"])("rejects %j", (input) =>
    expect(parseNumber(input)).toBeNaN());
});

describe("formatting helpers", () => {
  it("compact: short axis labels", () => {
    expect(compact(0)).toBe("0");
    expect(compact(999)).toBe("999");
    expect(compact(1000)).toBe("1k");
    expect(compact(12500)).toBe("12.5k");
    expect(compact(-2500)).toBe("-2.5k");
    expect(compact(null)).toBe("");
  });
  it("money: whole dollars with thousands separators", () => {
    expect(money(0)).toBe("$0");
    expect(money(1234.56)).toBe("$1,235");
    expect(money(270611.4)).toBe("$270,611");
  });
});
