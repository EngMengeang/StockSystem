import { useRef, useState, type ReactNode } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseCsv } from "@/lib/csv";
import { th, td } from "./kit";

export interface RowError { row: number; message: string }

interface Props<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** columns the file should have, shown to the user */
  columnsHint: string;
  sampleUrl: string;
  /** turn raw CSV rows into typed rows, and report what is wrong */
  parse: (rows: Record<string, string>[]) => { rows: T[]; errors: RowError[] };
  /** columns for the preview table */
  preview: { header: string; cell: (r: T) => ReactNode }[];
  /** columns the file MUST have: each entry lists the header names accepted for it (checked before anything else) */
  required: { label: string; anyOf: string[] }[];
  /** most rows one file may have */
  maxRows?: number;
  /** send the rows to the server; return a success message */
  onImport: (rows: T[]) => Promise<string>;
  importLabel: (n: number) => string;
}

/** Pick a CSV, preview it with any problems flagged, then import. Nothing is saved until you confirm. */
export function CsvImporter<T>({ open, onOpenChange, title, description, columnsHint, sampleUrl, parse, preview, onImport, importLabel, required, maxRows = 2000 }: Props<T>) {
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<T[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [fileError, setFileError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  const reset = () => { setFileName(""); setRows([]); setErrors([]); setFileError(""); setDone(""); setBusy(false); if (input.current) input.current.value = ""; };

  const readFile = async (file: File) => {
    reset();
    setFileName(file.name);
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") { setFileError("Please choose a .csv file."); return; }
    if (file.size > 1_000_000) { setFileError("That file is too big (max 1 MB)."); return; }
    const { headers, rows: raw } = parseCsv(await file.text());
    if (!headers.length || !raw.length) { setFileError("The file is empty, or has a header row but no data."); return; }
    const missing = required.filter((r) => !r.anyOf.some((h) => headers.includes(h)));
    if (missing.length) {
      setFileError(`This file has no "${missing.map((m) => m.label).join('" or "')}" column (found: ${headers.join(", ") || "none"}). Download the sample CSV to see the format.`);
      return;
    }
    if (raw.length > maxRows) { setFileError(`This file has ${raw.length.toLocaleString()} rows; the most allowed at once is ${maxRows.toLocaleString()}. Please split it into smaller files.`); return; }
    const result = parse(raw);
    setRows(result.rows); setErrors(result.errors);
  };

  const submit = async () => {
    setBusy(true);
    try { setDone(await onImport(rows)); }
    catch (e) {
      if (axios.isAxiosError(e) && Array.isArray(e.response?.data?.errors)) setErrors((e.response!.data.errors as RowError[]).map((x) => ({ ...x, row: x.row + 1 })));   // +1: the server counts data rows, the file also has a header row
      else setFileError(axios.isAxiosError(e) ? (e.response?.data?.message ?? "Could not reach the server.") : "Import failed.");
    } finally { setBusy(false); }
  };

  const hasFile = !!fileName && !fileError && !done;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4">
            <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p className="font-semibold">{done}</p>
            </div>
            <Button className="w-full rounded-xl" onClick={() => { reset(); onOpenChange(false); }}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3.5 text-sm text-slate-600">
              <p>Columns: <code className="rounded bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-800">{columnsHint}</code></p>
              <a href={sampleUrl} download className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline">
                <Download className="h-4 w-4" /> Download sample CSV
              </a>
            </div>

            <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) readFile(f); }}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">{fileName && !fileError ? <FileSpreadsheet className="h-5 w-5" /> : <Upload className="h-5 w-5" />}</span>
              <span className="text-sm font-medium text-slate-800">{fileName || "Click to choose a CSV file, or drop it here"}</span>
              <span className="text-xs text-slate-500">.csv, up to 1 MB</span>
              <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }} />
            </label>

            {fileError && <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{fileError}</p>}

            {hasFile && (
              <>
                {errors.length > 0 && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
                    <p className="mb-1.5 flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" />Fix {errors.length} problem{errors.length === 1 ? "" : "s"} in the file, then choose it again</p>
                    <ul className="max-h-32 space-y-0.5 overflow-y-auto pl-6 text-xs">
                      {[...errors].sort((a, b) => a.row - b.row).slice(0, 30).map((e, i) => <li key={i} className="list-disc">Row {e.row}: {e.message}</li>)}
                      {errors.length > 30 && <li className="list-none">…and {errors.length - 30} more</li>}
                    </ul>
                  </div>
                )}
                {rows.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Preview <span className="font-normal text-slate-500">({rows.length} row{rows.length === 1 ? "" : "s"}{rows.length > 6 ? ", first 6 shown" : ""})</span></p>
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full">
                        <thead className="bg-slate-50"><tr>{preview.map((c) => <th key={c.header} className={th}>{c.header}</th>)}</tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {rows.slice(0, 6).map((r, i) => <tr key={i}>{preview.map((c) => <td key={c.header} className={td}>{c.cell(r)}</td>)}</tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <Button className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold" disabled={busy || errors.length > 0 || rows.length === 0} onClick={submit}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} {errors.length > 0 ? "Fix the problems above to import" : importLabel(rows.length)}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
