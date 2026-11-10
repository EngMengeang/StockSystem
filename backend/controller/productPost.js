import * as psqlProduct from "../respositories/psqlProduct.js";
import { toInt, toMoney, cleanText, isRealDate, isObject, LIMITS } from "../ulits/validate.js";

const fail = (res, status, message, errors) => res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
const serverError = (res, where, error) => {
  // two requests creating the same product at once: the database's unique-name rule catches the second one
  if (error.name === "SequelizeUniqueConstraintError") return fail(res, 409, "That already exists (a product with this name or code is already in the system).");
  console.error(`${where}:`, error.message);
  return fail(res, 500, "Something went wrong on the server. Please try again.");
};

/** Check product fields from a request body. `partial` = every field optional (used by update). */
function readProduct(body, { partial = false } = {}) {
  const errors = [];
  const out = {};
  if (!isObject(body)) return { errors: [{ message: "Send the product details as JSON." }] };

  if (!partial || body.p_name !== undefined) {
    const name = cleanText(body.p_name, LIMITS.name);
    if (!name) errors.push({ field: "p_name", message: `Product name is required (up to ${LIMITS.name} characters).` }); else out.p_name = name;
  }
  if (!partial || body.p_price !== undefined) {
    const price = toMoney(body.p_price);
    if (Number.isNaN(price) || price > LIMITS.price) errors.push({ field: "p_price", message: "Price must be a number of 0 or more." }); else out.p_price = price;
  }
  if (body.p_cost !== undefined && body.p_cost !== null && body.p_cost !== "") {
    const cost = toMoney(body.p_cost);
    if (Number.isNaN(cost) || cost > LIMITS.price) errors.push({ field: "p_cost", message: "Cost must be a number of 0 or more." }); else out.p_cost = cost;
  }
  if (body.reorder_level !== undefined && body.reorder_level !== null && body.reorder_level !== "") {
    const r = toInt(body.reorder_level);
    if (Number.isNaN(r) || r > LIMITS.quantity) errors.push({ field: "reorder_level", message: "Low-stock level must be a whole number of 0 or more." }); else out.reorder_level = r;
  }
  if (body.category_id !== undefined) {
    if (body.category_id === null || body.category_id === "") out.category_id = null;
    else {
      const c = toInt(body.category_id);
      if (Number.isNaN(c)) errors.push({ field: "category_id", message: "Category is not valid." }); else out.category_id = c;
    }
  }
  if (body.sku !== undefined && body.sku !== null && body.sku !== "") {
    const sku = cleanText(body.sku, LIMITS.sku);
    if (!sku) errors.push({ field: "sku", message: `SKU can be up to ${LIMITS.sku} characters.` }); else out.sku = sku;
  }
  if (!partial) {
    const q = body.imp_quantity === undefined || body.imp_quantity === null || body.imp_quantity === "" ? 0 : toInt(body.imp_quantity);
    if (Number.isNaN(q) || q > LIMITS.quantity) errors.push({ field: "imp_quantity", message: "Opening stock must be a whole number of 0 or more." }); else out.imp_quantity = q;
  }
  return { errors, value: out };
}

// get all (active) products
export const getAllProduct = async (req, res) => {
  try {
    res.json(await psqlProduct.getProducts());
  } catch (error) {
    serverError(res, "getAllProduct", error);
  }
};

export const updateProduct = async (req, res) => {
  const id = toInt(req.params.id);
  if (Number.isNaN(id)) return fail(res, 400, "Invalid product ID");
  const { errors, value } = readProduct(req.body, { partial: true });
  if (errors.length) return fail(res, 400, errors[0].message, errors);

  try {
    const result = await psqlProduct.updateProductById(id, value);
    if (result === null) return fail(res, 404, "Product not found");
    if (result.duplicate) return fail(res, 409, `Another product is already called "${value.p_name}".`);
    res.status(200).json({ message: "Product updated successfully", product: result });
  } catch (error) {
    serverError(res, "updateProduct", error);
  }
};

// delete product (products with sales are deactivated instead, to keep history)
export const deleteProduct = async (req, res) => {
  const id = toInt(req.params.id);
  if (Number.isNaN(id)) return fail(res, 400, "Invalid product ID");
  try {
    const result = await psqlProduct.deleteProductById(id);
    if (!result.found) return fail(res, 404, "Product not found");
    res.json({
      message: result.deactivated
        ? "Product has sales history, so it was hidden instead of deleted."
        : "Product deleted successfully",
      deactivated: result.deactivated,
    });
  } catch (error) {
    serverError(res, "deleteProduct", error);
  }
};

// create a product, or add stock to an existing one with the same name
export const createProduct = async (req, res) => {
  const { errors, value } = readProduct(req.body);
  if (errors.length) return fail(res, 400, errors[0].message, errors);
  try {
    res.status(200).json(await psqlProduct.insertProduct(value));
  } catch (error) {
    serverError(res, "createProduct", error);
  }
};

export const getProductByName = async (req, res) => {
  try {
    const productData = await psqlProduct.getProductByName(req.params.name);
    if (!productData) return fail(res, 404, "Product not found");
    res.status(200).json(productData);
  } catch (error) {
    serverError(res, "getProductByName", error);
  }
};

// one sale of one product (older, simple endpoint)
export const saleProduct = async (req, res) => {
  const name = cleanText(req.body?.p_name, LIMITS.name);
  const quantity = req.body?.quantity;
  if (!name || !Number.isInteger(quantity) || quantity <= 0 || quantity > LIMITS.quantity) {
    return fail(res, 400, "Invalid input: send a product name and a whole quantity above 0.");
  }
  try {
    const result = await psqlProduct.saleProducts(name, quantity);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return serverError(res, "saleProduct", error);
  }
};

// the next four list endpoints return an empty list (not an error) when there is nothing yet
export const getSoldProduct = async (req, res) => {
  try { res.status(200).json(await psqlProduct.getAllSoldProducts()); } catch (error) { serverError(res, "getSoldProduct", error); }
};

export const expireProductController = async (req, res) => {
  const name = cleanText(req.body?.p_name, LIMITS.name);
  if (!name) return fail(res, 400, "Send the product name to write off.");
  try {
    const result = await psqlProduct.expireProductByName(name);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    serverError(res, "expireProduct", error);
  }
};

export const getExpiredProductsController = async (req, res) => {
  try { res.status(200).json(await psqlProduct.getAllExpiredProducts()); } catch (error) { serverError(res, "getExpired", error); }
};

export const getInventorySummaryController = async (req, res) => {
  try { res.status(200).json(await psqlProduct.getProductInventorySummary()); } catch (error) { serverError(res, "getInventorySummary", error); }
};

// ---- dashboard data ----
export const getOverviewController = async (req, res) => {
  const { from, to, product_id, category_id } = req.query;
  const one = (v) => (Array.isArray(v) ? undefined : v);        // a repeated ?from=a&from=b is rejected
  for (const [label, v] of [["from", from], ["to", to]]) {
    if (v !== undefined && (!isRealDate(one(v)))) return fail(res, 400, `"${label}" must be a real date like 2026-01-31.`);
  }
  if (from && to && from > to) return fail(res, 400, "The start date must not be after the end date.");
  const pid = product_id === undefined || product_id === "" ? null : toInt(product_id);
  const cid = category_id === undefined || category_id === "" ? null : toInt(category_id);
  if (Number.isNaN(pid)) return fail(res, 400, "product_id must be a number.");
  if (Number.isNaN(cid)) return fail(res, 400, "category_id must be a number.");
  try {
    res.status(200).json(await psqlProduct.getOverviewData(from, to, pid, cid));
  } catch (error) {
    serverError(res, "overview", error);
  }
};

export const getInventoryAnalyticsController = async (req, res) => {
  try { res.status(200).json(await psqlProduct.getInventoryAnalytics()); } catch (error) { serverError(res, "inventoryAnalytics", error); }
};

// ---- categories ----
export const getCategoriesController = async (req, res) => {
  try { res.status(200).json(await psqlProduct.getCategories()); } catch (error) { serverError(res, "getCategories", error); }
};

export const createCategoryController = async (req, res) => {
  const name = cleanText(req.body?.name, LIMITS.category);
  if (!name) return fail(res, 400, `Category name is required (up to ${LIMITS.category} characters).`);
  try {
    res.status(201).json(await psqlProduct.createCategory(name));
  } catch (error) {
    serverError(res, "createCategory", error);
  }
};

// ---- several at once ----
export const saleBatchController = async (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length === 0) return fail(res, 400, "Add at least one item.");
  if (items.length > 2000) return fail(res, 400, "Too many rows (max 2000).");

  const errors = [];
  const clean = items.map((it, i) => {
    const row = i + 1;
    if (!isObject(it)) { errors.push({ row, message: "This row is not valid." }); return null; }
    const qty = it.quantity;
    if (!Number.isInteger(qty) || qty <= 0 || qty > LIMITS.quantity) { errors.push({ row, message: "Quantity must be a whole number above 0." }); return null; }
    if (it.date !== undefined && it.date !== null && it.date !== "" && !isRealDate(it.date)) { errors.push({ row, message: "Date must be a real date like 2026-11-05." }); return null; }
    const p_id = it.p_id === undefined ? undefined : toInt(it.p_id);
    const p_name = it.p_name === undefined ? undefined : cleanText(it.p_name, LIMITS.name);
    if ((p_id === undefined && !p_name) || Number.isNaN(p_id)) { errors.push({ row, message: "Product is missing or not valid." }); return null; }
    return { p_id, p_name, quantity: qty, date: it.date || undefined };
  });
  if (errors.length) return fail(res, 400, "Some rows need fixing.", errors);

  try {
    const result = await psqlProduct.saleBatch(clean);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    serverError(res, "saleBatch", error);
  }
};

export const importProductsController = async (req, res) => {
  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0) return fail(res, 400, "The file has no rows.");
  if (rows.length > 2000) return fail(res, 400, "Too many rows (max 2000).");
  const bad = rows.findIndex((r) => !isObject(r));
  if (bad >= 0) return fail(res, 400, "Some rows need fixing.", [{ row: bad + 1, message: "This row is not valid." }]);
  try {
    const result = await psqlProduct.importProducts(rows);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    serverError(res, "importProducts", error);
  }
};
