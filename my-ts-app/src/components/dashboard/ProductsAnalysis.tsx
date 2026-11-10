import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart } from '@mui/x-charts/BarChart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Edit, FileSpreadsheet, Package, Plus, Save, Search, Tag, Trash2 } from "lucide-react";
import { getMyProducts, postProduct, updateProduct, deleteProduct, getCategories, postCategory, postProductsImport } from "@/services/productService";
import { pick, parseNumber } from "@/lib/csv";
import { errorText } from "@/lib/session";
import { PageHeader, Panel, StatCard, Segmented, Pill, Empty, COLORS, CHART_SX, th, td } from "./kit";
import { CsvImporter, type RowError } from "./CsvImporter";

interface ProductRow {
  p_id: number; p_name: string; p_price: number; p_cost: number; sku: string | null; reorder_level: number;
  category_id: number | null; category?: { category_id: number; name: string } | null; Stock?: { s_quantity: number } | null;
}
interface CategoryRow { category_id: number; name: string }
interface ProductCsvRow { p_name: string; category: string; p_price: number; p_cost?: number; stock: number; reorder_level?: number; exists: boolean }
const EMPTY_FORM = { p_name: "", p_price: "", p_cost: "", category_id: "", new_category: "", reorder_level: "10", imp_quantity: "" };
const NEW_CATEGORY = "__new__";
const selectCls = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

export const ProductAnalysis = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_FORM);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tab, setTab] = useState<"list" | "chart">("list");
  const [formError, setFormError] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [csvOpen, setCsvOpen] = useState(false);

  const fetchProducts = async () => {
    try { setProducts(await getMyProducts()); setLoadError(""); } catch (error) { setLoadError(errorText(error, "Could not load the products.")); }
  };
  const fetchCategories = () => getCategories().then(setCategories).catch(() => setCategories([]));
  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const price = parseFloat(productForm.p_price);
      const cost = productForm.p_cost === "" ? 0 : parseFloat(productForm.p_cost);
      const stock = parseInt(productForm.imp_quantity || "0");
      if (!productForm.p_name.trim() || isNaN(price) || price < 0 || isNaN(cost) || cost < 0 || (!editingProduct && isNaN(stock))) {
        setFormError("Please fill in all fields correctly.");
        return;
      }
      // category: pick an existing one, or create a new one on the fly
      let category_id: number | null = productForm.category_id && productForm.category_id !== NEW_CATEGORY ? Number(productForm.category_id) : null;
      if (productForm.category_id === NEW_CATEGORY && productForm.new_category.trim()) {
        category_id = (await postCategory(productForm.new_category.trim())).category_id;
        fetchCategories();
      }
      const productData = {
        p_name: productForm.p_name.trim(), p_price: price, p_cost: cost, category_id,
        reorder_level: parseInt(productForm.reorder_level || "10"), imp_quantity: stock,
      };
      if (editingProduct) { await updateProduct(productData, editingProduct.p_id); setEditingProduct(null); }
      else await postProduct(productData);
      setProductForm(EMPTY_FORM); setFormError(""); setIsDialogOpen(false);
      fetchProducts();
    } catch (error) { setFormError(errorText(error, "Could not save the product.")); }
  };

  const handleEdit = (product: ProductRow) => {
    setEditingProduct(product); setFormError("");
    setProductForm({
      p_name: product.p_name || "", p_price: String(product.p_price ?? ""), p_cost: String(product.p_cost ?? ""),
      category_id: product.category_id ? String(product.category_id) : "", new_category: "",
      reorder_level: String(product.reorder_level ?? 10), imp_quantity: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this product? If it already has sales it will be hidden instead, so your sales history stays correct.")) return;
    try {
      const r = await deleteProduct(id);
      setNotice(r?.message ?? "");
      fetchProducts();
    } catch (e) {
      setNotice(errorText(e, "Could not delete the product."));
    }
  };

  const filtered = products.filter((p) => p.p_name.toLowerCase().includes(searchTerm.toLowerCase()) && (!typeFilter || String(p.category_id) === typeFilter));
  const low = products.filter((p) => (p.Stock?.s_quantity ?? 0) <= (p.reorder_level ?? 10));
  const units = products.reduce((s, p) => s + (p.Stock?.s_quantity ?? 0), 0);
  const avgPrice = products.length ? products.reduce((s, p) => s + Number(p.p_price), 0) / products.length : 0;

  // ---- CSV import of products ----
  const parseProducts = (raw: Record<string, string>[]) => {
    const rows: ProductCsvRow[] = []; const errors: RowError[] = [];
    const known = new Set(products.map((p) => p.p_name.trim().toLowerCase()));
    const seen = new Set<string>();
    raw.forEach((r, i) => {
      const row = i + 2; // spreadsheet row (row 1 is the header)
      const name = pick(r, "name", "product", "productname", "pname");
      const priceText = pick(r, "price", "sellingprice", "pprice");
      const price = parseNumber(priceText);
      const costText = pick(r, "cost", "costprice", "pcost");
      const stockText = pick(r, "stock", "quantity", "qty", "openingstock");
      const reorderText = pick(r, "reorderlevel", "reorder", "lowstock");
      if (!name) return errors.push({ row, message: "Name is missing" });
      if (seen.has(name.toLowerCase())) return errors.push({ row, message: `"${name}" appears twice in the file` });
      if (!Number.isFinite(price)) return errors.push({ row, message: `Price is missing or not a number (${name})` });
      const cost = costText === "" ? undefined : parseNumber(costText);      // blank = keep the current cost
      const stock = stockText === "" ? 0 : parseNumber(stockText);
      const reorder = reorderText === "" ? undefined : parseNumber(reorderText);   // blank = keep the current level
      if (cost !== undefined && !Number.isFinite(cost)) return errors.push({ row, message: `Cost is not a number (${name})` });
      if (!Number.isInteger(stock) || stock < 0) return errors.push({ row, message: `Stock must be a whole number (${name})` });
      if (reorder !== undefined && (!Number.isInteger(reorder) || reorder < 0)) return errors.push({ row, message: `Reorder level must be a whole number (${name})` });
      seen.add(name.toLowerCase());
      rows.push({ p_name: name, category: pick(r, "type", "category"), p_price: price, p_cost: cost, stock, reorder_level: reorder, exists: known.has(name.toLowerCase()) });
    });
    return { rows, errors };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Products" subtitle="Your catalogue, prices and current stock">
        <div className="flex flex-wrap items-center gap-2">
        <a href="/samples/sample-products.csv" download className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
          <Download className="h-4 w-4" /> Sample CSV
        </a>
        <button onClick={() => setCsvOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/50">
          <FileSpreadsheet className="h-4 w-4 text-indigo-600" /> Import CSV
        </button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 shadow-md shadow-indigo-500/25 hover:opacity-95"
              onClick={() => { setEditingProduct(null); setProductForm(EMPTY_FORM); setFormError(""); }}>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl bg-white">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit product" : "Add new product"}</DialogTitle>
              <DialogDescription>{editingProduct ? "Update the product information" : "Enter the product information below"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productname">Product name</Label>
                <Input id="productname" className="h-10 rounded-xl" value={productForm.p_name} onChange={(e) => setProductForm({ ...productForm, p_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" className={selectCls} value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                  <option value={NEW_CATEGORY}>+ New category…</option>
                </select>
                {productForm.category_id === NEW_CATEGORY && (
                  <Input aria-label="New category name" placeholder="New category name" className="h-10 rounded-xl" value={productForm.new_category}
                    onChange={(e) => setProductForm({ ...productForm, new_category: e.target.value })} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitprice">Selling price ($)</Label>
                  <Input id="unitprice" type="number" step="0.01" min="0" className="h-10 rounded-xl" value={productForm.p_price} onChange={(e) => setProductForm({ ...productForm, p_price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitcost">Cost price ($)</Label>
                  <Input id="unitcost" type="number" step="0.01" min="0" className="h-10 rounded-xl" value={productForm.p_cost} onChange={(e) => setProductForm({ ...productForm, p_cost: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder">Low-stock level</Label>
                  <Input id="reorder" type="number" min="0" className="h-10 rounded-xl" value={productForm.reorder_level} onChange={(e) => setProductForm({ ...productForm, reorder_level: e.target.value })} />
                </div>
                {!editingProduct && (
                  <div className="space-y-2">
                    <Label htmlFor="stockquantity">Opening stock</Label>
                    <Input id="stockquantity" type="number" min="0" className="h-10 rounded-xl" value={productForm.imp_quantity} onChange={(e) => setProductForm({ ...productForm, imp_quantity: e.target.value })} required />
                  </div>
                )}
              </div>
              {formError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}
              <Button type="submit" className="h-10 w-full rounded-xl"><Save className="h-4 w-4" /> {editingProduct ? "Update product" : "Add product"}</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Products" value={products.length} note="In your catalogue" icon={Package} tone="indigo" />
        <StatCard label="Low stock" value={low.length} note={low.length ? "At or below reorder level" : "Everything is stocked"} noteClass={low.length ? "text-rose-600" : "text-emerald-600"} icon={AlertTriangle} tone="rose" />
        <StatCard label="Average price" value={`$${avgPrice.toFixed(2)}`} note={`${units.toLocaleString()} units in stock`} icon={Tag} tone="emerald" />
      </div>

      {loadError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError} <button onClick={fetchProducts} className="font-semibold underline">Try again</button></p>}

      {notice && (
        <div role="status" className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {notice}<button onClick={() => setNotice("")} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      <Panel
        title="All products"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">
              <option value="">All types</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input aria-label="Search products" placeholder="Search products…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 w-56 rounded-xl pl-9" />
            </div>
            <Segmented value={tab} onChange={setTab} options={[{ id: "list", label: "List" }, { id: "chart", label: "Prices" }]} />
          </div>
        }
      >
        {tab === "list" ? (
          filtered.length === 0 ? <Empty>No matching products</Empty> : (
            <div className="scroll-soft max-h-[520px] overflow-auto rounded-xl border border-slate-100">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50">
                  <tr><th className={th}>Product</th><th className={th}>Category</th><th className={th}>Price</th><th className={th}>Cost</th><th className={th}>Margin</th><th className={th}>Stock</th><th className={`${th} text-right`}>Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => {
                    const stock = p.Stock?.s_quantity ?? 0;
                    const reorder = p.reorder_level ?? 10;
                    const margin = Number(p.p_price) ? ((Number(p.p_price) - Number(p.p_cost)) / Number(p.p_price)) * 100 : 0;
                    return (
                      <tr key={p.p_id} className="transition-colors hover:bg-slate-50/70">
                        <td className={td}><p className="font-medium text-slate-900">{p.p_name}</p><p className="text-xs text-slate-400">{p.sku}</p></td>
                        <td className={td}>{p.category ? <Pill tone="indigo">{p.category.name}</Pill> : <span className="text-slate-400">–</span>}</td>
                        <td className={`${td} tabular-nums`}>${Number(p.p_price).toFixed(2)}</td>
                        <td className={`${td} tabular-nums`}>${Number(p.p_cost).toFixed(2)}</td>
                        <td className={`${td} tabular-nums ${margin < 20 ? "text-rose-600" : ""}`}>{Number(p.p_cost) ? `${margin.toFixed(0)}%` : "–"}</td>
                        <td className={td}><Pill tone={stock <= reorder ? "red" : stock <= reorder * 2 ? "amber" : "green"}>{stock} in stock</Pill></td>
                        <td className={`${td} text-right`}>
                          <button aria-label={`Edit ${p.p_name}`} onClick={() => handleEdit(p)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"><Edit className="h-4 w-4" /></button>
                          <button aria-label={`Delete ${p.p_name}`} onClick={() => handleDelete(p.p_id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <BarChart
            xAxis={[{ id: 'products', data: filtered.map((p) => p.p_name), scaleType: 'band', tickLabelStyle: { angle: -35, textAnchor: 'end', fontSize: 11 }, height: 90 }]}
            series={[{ data: filtered.map((p) => Number(p.p_price)), label: 'Price ($)', color: COLORS.indigo }]}
            height={360}
            sx={CHART_SX}
          />
        )}
      </Panel>

      <CsvImporter<ProductCsvRow>
        open={csvOpen} onOpenChange={setCsvOpen}
        title="Import products from CSV"
        description="Add many products at once. A product that already exists (same name) is updated, and its stock is added to what you have. Nothing is saved if any row has a problem."
        columnsHint="name, type, price, cost, stock, reorder_level"
        required={[{ label: "name", anyOf: ["name", "product", "productname", "pname"] }, { label: "price", anyOf: ["price", "sellingprice", "pprice"] }]}
        sampleUrl="/samples/sample-products.csv"
        parse={parseProducts}
        preview={[
          { header: "Name", cell: (r) => r.p_name },
          { header: "Type", cell: (r) => r.category || "–" },
          { header: "Price", cell: (r) => `$${r.p_price}` },
          { header: "Stock", cell: (r) => `+${r.stock}` },
          { header: "", cell: (r) => (r.exists ? <Pill tone="amber">update</Pill> : <Pill tone="green">new</Pill>) },
        ]}
        importLabel={(n) => `Import ${n} product${n === 1 ? "" : "s"}`}
        onImport={async (rows) => {
          const r = await postProductsImport(rows.map((x) => ({ p_name: x.p_name, category: x.category, p_price: x.p_price, p_cost: x.p_cost, stock: x.stock, reorder_level: x.reorder_level })));
          fetchProducts(); fetchCategories();
          return `Done: ${r.created} new, ${r.updated} updated, ${r.stock_added} units added to stock.`;
        }}
      />
    </div>
  );
};
