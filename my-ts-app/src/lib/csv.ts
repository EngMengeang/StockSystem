/** Small CSV reader: handles quotes ("MacBook Air 13"""), commas or semicolons, a BOM, and blank lines. */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const src = text.replace(/^\uFEFF/, "");
  const delimiter = (src.split(/\r?\n/, 1)[0].match(/;/g)?.length ?? 0) > (src.split(/\r?\n/, 1)[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const records: string[][] = [];
  let field = "", row: string[] = [], quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"' && field === "") quoted = true;   // a quote only opens a quoted field at its start
    else if (c === delimiter) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x.trim() !== "")) records.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== "")) records.push(row);
  if (!records.length) return { headers: [], rows: [] };
  // normalise headers: "Product Name" / "product_name" -> "productname"
  const headers = records[0].map((h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""));
  const rows = records.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
  return { headers, rows };
}

/** First non-empty value among several possible column names. */
export const pick = (row: Record<string, string>, ...names: string[]) => {
  for (const n of names) if (row[n] !== undefined && row[n] !== "") return row[n];
  return "";
};

/**
 * Read a number the way spreadsheets write it: "1299", "1,299.50", "$1,299", " 12 ". Blank gives NaN.
 * (A European "12,5" is NOT guessed at; it is rejected so a wrong price never slips in.)
 */
export function parseNumber(text: string): number {
  const t = text.trim().replace(/^\$/, "").replace(/\s/g, "");
  if (t === "") return NaN;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return Number(t.replace(/,/g, ""));
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}
