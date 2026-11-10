import sequelize from "../ulits/database.js";
import Product from "../model/product.js";
import ImportProduct from "../model/importProduct.js";
import ExpireProduct from "../model/expireProduct.js";
import Stock from "../model/stock.js";
import Category from "../model/category.js";
import { Sequelize } from "sequelize";
import Sale from "../model/sale.js";
import { cleanText, toInt, toMoneyLoose, LIMITS } from "../ulits/validate.js";

/** match a product by name ignoring capitals (the database also refuses names that differ only in capitals) */
const byName = (name) => Sequelize.where(Sequelize.fn('lower', Sequelize.col('p_name')), String(name).trim().toLowerCase());

const PRODUCT_FIELDS = ['p_id', 'p_name', 'p_price', 'p_cost', 'sku', 'category_id', 'reorder_level'];
const withStockAndCategory = [
  { model: Stock, as: 'Stock', attributes: ['s_quantity'] },
  { model: Category, as: 'category', attributes: ['category_id', 'name'] },
];

// get all (active) products
export async function getProducts() {
  return Product.findAll({
    attributes: PRODUCT_FIELDS,
    where: { is_active: true },
    include: withStockAndCategory,
    order: [['p_name', 'ASC']],
  });
}

// update product (price, cost, category, sku, reorder level, name)
export async function updateProductById(p_id, updateData) {
  const product = await Product.findOne({ where: { p_id } });
  if (!product) return null;
  // renaming onto another product's name would create two products with one name
  if (updateData.p_name !== undefined) {
    const clash = await Product.findOne({
      where: { [Sequelize.Op.and]: [Sequelize.where(Sequelize.fn("lower", Sequelize.col("p_name")), updateData.p_name.toLowerCase()), { p_id: { [Sequelize.Op.ne]: p_id } }] },
    });
    if (clash) return { duplicate: true };
  }
  const allowed = ['p_name', 'p_price', 'p_cost', 'category_id', 'sku', 'reorder_level'];
  for (const k of allowed) if (updateData[k] !== undefined) product[k] = updateData[k];
  await product.save();
  return product;
}

/**
 * Delete a product. A product that already has sales is kept (deactivated) so
 * past revenue and profit stay correct; one with no sales is really deleted.
 */
export async function deleteProductById(p_id) {
  const product = await Product.findOne({ where: { p_id } });
  if (!product) return { found: false };
  const hasSales = await Sale.count({ where: { p_id } });
  if (hasSales > 0) {
    await product.update({ is_active: false });
    return { found: true, deactivated: true };
  }
  await sequelize.transaction(async (t) => {
    await ImportProduct.destroy({ where: { p_id }, transaction: t });
    await ExpireProduct.destroy({ where: { p_id }, transaction: t });
    await Stock.destroy({ where: { p_id }, transaction: t });
    await product.destroy({ transaction: t });
  });
  return { found: true, deactivated: false };
}

// create new product, or add stock to an existing one with the same name
export async function insertProduct(data) {
  const { p_name, p_price, imp_quantity, category_id, p_cost, sku, reorder_level } = data;

  return sequelize.transaction(async (t) => {
    let product = await Product.findOne({ where: byName(p_name), transaction: t });
    const extra = {};
    if (category_id !== undefined) extra.category_id = category_id || null;
    if (p_cost !== undefined) extra.p_cost = p_cost;
    if (reorder_level !== undefined) extra.reorder_level = reorder_level;

    if (product) {
      await product.update({ p_price, ...extra }, { transaction: t });
    } else {
      product = await Product.create({ p_name, p_price, ...extra }, { transaction: t });
      await product.update({ sku: sku || `SKU-${String(product.p_id).padStart(4, '0')}` }, { transaction: t });
    }

    await ImportProduct.create({ p_id: product.p_id, imp_quantity, unit_cost: product.p_cost }, { transaction: t });
    const stock = await Stock.findOne({ where: { p_id: product.p_id }, transaction: t, lock: t.LOCK.UPDATE });
    if (stock) { stock.s_quantity += imp_quantity; await stock.save({ transaction: t }); }
    else await Stock.create({ p_id: product.p_id, s_quantity: imp_quantity }, { transaction: t });

    return { message: "Product saved with import and stock" };
  });
}

export async function getProductByName(p_name) {
  const product = await Product.findOne({ where: byName(p_name), attributes: PRODUCT_FIELDS, include: withStockAndCategory });
  if (!product) return null;
  return {
    p_id: product.p_id, p_name: product.p_name, p_price: product.p_price,
    s_quantity: product.Stock ? product.Stock.s_quantity : 0,
  };
}

// sell a product: check stock, deduct it and record the sale in ONE transaction
export async function saleProducts(p_name, quantity) {
  return sequelize.transaction(async (t) => {
    const product = await Product.findOne({ where: { [Sequelize.Op.and]: [byName(p_name), { is_active: true }] }, transaction: t });
    if (!product) return { success: false, message: "Product not found" };

    // lock the stock row so two sales at the same time cannot oversell
    const stock = await Stock.findOne({ where: { p_id: product.p_id }, transaction: t, lock: t.LOCK.UPDATE });
    if (!stock || stock.s_quantity < quantity) return { success: false, message: "Insufficient stock" };

    stock.s_quantity -= quantity;
    await stock.save({ transaction: t });
    await Sale.create({ p_id: product.p_id, quantity, unit_price: product.p_price }, { transaction: t });

    return { success: true, message: "Sale successful", remaining_stock: stock.s_quantity };
  });
}

// total units sold per product
export async function getAllSoldProducts() {
  const results = await Sale.findAll({
    attributes: [
      [Sequelize.col('product.p_id'), 'p_id'],
      [Sequelize.col('product.p_name'), 'p_name'],
      [Sequelize.fn('SUM', Sequelize.col('sale.quantity')), 'total_quantity_sold'],
    ],
    include: [{ model: Product, as: 'product', attributes: [] }],
    group: ['product.p_id', 'product.p_name'],
    order: [[Sequelize.literal('total_quantity_sold'), 'DESC']],
  });
  return results.map((sale) => ({
    p_id: sale.get('p_id'), p_name: sale.get('p_name'), quantity: Number(sale.get('total_quantity_sold')),
  }));
}

// write off ALL remaining stock of a product as expired
export async function expireProductByName(p_name) {
  return sequelize.transaction(async (t) => {
    const product = await Product.findOne({ where: byName(p_name), transaction: t });
    if (!product) return { success: false, message: "Product not found" };

    const stock = await Stock.findOne({ where: { p_id: product.p_id }, transaction: t, lock: t.LOCK.UPDATE });
    if (!stock || stock.s_quantity <= 0) return { success: false, message: "No stock available to expire" };

    const quantityToExpire = stock.s_quantity;
    await ExpireProduct.create({ p_id: product.p_id, quantity: quantityToExpire }, { transaction: t });
    stock.s_quantity = 0;
    await stock.save({ transaction: t });

    return { success: true, message: `Wrote off ${quantityToExpire} unit(s) of '${p_name}'`, expired_quantity: quantityToExpire };
  });
}

export async function getAllExpiredProducts() {
  const results = await ExpireProduct.findAll({
    include: [{ model: Product, as: "product", attributes: ["p_name"] }],
    attributes: ["quantity", "createdAt"],
    order: [['createdAt', 'DESC']],
  });
  return results.map((e) => ({ p_name: e.product?.p_name || "Unknown", quantity: e.quantity, date: e.createdAt }));
}

export async function getProductInventorySummary() {
  const [results] = await sequelize.query(`
    SELECT p.p_id, p.p_name,
           COALESCE(i.total_import, 0) AS total_import,
           COALESCE(s.total_sold, 0) AS quantity_sold,
           COALESCE(e.total_expired, 0) AS quantity_expired
    FROM products p
    LEFT JOIN (SELECT p_id, SUM(imp_quantity) AS total_import FROM imports GROUP BY p_id) i ON p.p_id = i.p_id
    LEFT JOIN (SELECT p_id, SUM(quantity) AS total_sold FROM sales GROUP BY p_id) s ON p.p_id = s.p_id
    LEFT JOIN (SELECT p_id, SUM(quantity) AS total_expired FROM expires GROUP BY p_id) e ON p.p_id = e.p_id
    WHERE p.is_active
    ORDER BY p.p_name ASC`);
  return results;
}

// ---------- Categories ----------
export const getCategories = () => Category.findAll({ order: [['name', 'ASC']] });
export const createCategory = (name) => Category.findOrCreate({ where: { name } }).then(([c]) => c);

// ---------- Overview page data (revenue, profit, categories, trends) ----------
// revenue = quantity x price at the time of sale (falls back to current price for old rows)
// from / to are YYYY-MM-DD (inclusive). Defaults to the last 30 days.
const TZ = process.env.BUSINESS_TZ || "UTC";   // time zone used for hour-of-day / weekday charts

export async function getOverviewData(fromStr, toStr, productId = null, categoryId = null) {
  const DAY = 86400000;
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  let to = toStr ? new Date(`${toStr}T00:00:00Z`) : today;
  if (to > today) to = today;          // e.g. "whole of 2026" should stop at today, not run into the future
  let from = fromStr ? new Date(`${fromStr}T00:00:00Z`) : new Date(to.getTime() - 29 * DAY);

  // "all time": never start before the first sale
  const [{ first }] = (await sequelize.query('SELECT MIN("createdAt") AS first FROM sales'))[0];
  if (first && from < new Date(first)) from = new Date(new Date(first).toISOString().slice(0, 10) + "T00:00:00Z");
  if (from > to) from = to;

  const days = Math.round((to - from) / DAY) + 1;
  const bucket = days <= 62 ? "day" : "week";           // keep long ranges readable
  const rep = {
    from, toExcl: new Date(to.getTime() + DAY),
    prevFrom: new Date(from.getTime() - days * DAY), prevToExcl: from, productId, categoryId,
  };

  const q = async (sql) => (await sequelize.query(sql, { replacements: rep }))[0];
  const REV = "s.quantity * COALESCE(s.unit_price, p.p_price)";
  const COST = "s.quantity * p.p_cost";
  const FROM = 'FROM sales s JOIN products p ON p.p_id = s.p_id';
  // optional filters: one product and/or one type (category)
  const ONLY = (productId ? " AND s.p_id = :productId" : "") + (categoryId ? " AND p.category_id = :categoryId" : "");
  const IN_RANGE = 's."createdAt" >= :from AND s."createdAt" < :toExcl' + ONLY;

  const [totals] = await q(`
    SELECT COALESCE(SUM(${REV}),0) AS revenue, COALESCE(SUM(${COST}),0) AS cost,
           COALESCE(SUM(s.quantity),0) AS units, COUNT(*) AS orders
    ${FROM} WHERE ${IN_RANGE}`);
  const [prev] = await q(`
    SELECT COALESCE(SUM(${REV}),0) AS revenue
    ${FROM} WHERE s."createdAt" >= :prevFrom AND s."createdAt" < :prevToExcl${ONLY}`);
  // revenue / profit / orders per day (or week) for a date window; run for this period and the one before it
  const series = (f, t) => q(`
    SELECT to_char(b, ${bucket === "day" ? "'Mon DD'" : "'\"Wk of\" Mon DD'"}) AS day,
           COALESCE(SUM(x.rev),0) AS revenue, COALESCE(SUM(x.rev - x.cost),0) AS profit, COUNT(x.sid) AS orders
    FROM generate_series(date_trunc('${bucket}', CAST(${f} AS date)), CAST(${t} AS date) - 1, interval '1 ${bucket}') b
    LEFT JOIN (SELECT s.sale_id AS sid, ${REV} AS rev, ${COST} AS cost, s."createdAt" AS at ${FROM}
               WHERE s."createdAt" >= ${f} AND s."createdAt" < ${t}${ONLY}) x
           ON date_trunc('${bucket}', x.at) = b
    GROUP BY b ORDER BY b`);
  const daily = await series(":from", ":toExcl");
  const prevDaily = await series(":prevFrom", ":prevToExcl");
  const byCategory = await q(`
    SELECT COALESCE(c.name, 'Uncategorized') AS category, SUM(${REV}) AS revenue, SUM(${REV} - ${COST}) AS profit
    ${FROM} LEFT JOIN categories c ON c.category_id = p.category_id
    WHERE ${IN_RANGE} GROUP BY 1 ORDER BY 2 DESC`);
  const topProducts = await q(`
    SELECT p.p_name, SUM(${REV}) AS revenue, SUM(s.quantity) AS units
    ${FROM} WHERE ${IN_RANGE} GROUP BY p.p_name ORDER BY 2 DESC LIMIT 5`);
  const byWeekday = await q(`
    SELECT EXTRACT(DOW FROM s."createdAt" AT TIME ZONE '${TZ}')::int AS dow, SUM(${REV}) AS revenue ${FROM} WHERE ${IN_RANGE} GROUP BY 1 ORDER BY 1`);
  // low stock and stock value are "right now" figures; expired loss follows the selected dates
  // every product in the period: revenue, profit, units (for the Pareto and margin charts)
  const productStats = await q(`
    SELECT p.p_id, p.p_name, COALESCE(c.name, 'Uncategorized') AS category,
           SUM(${REV}) AS revenue, SUM(${REV} - ${COST}) AS profit, SUM(s.quantity) AS units
    ${FROM} LEFT JOIN categories c ON c.category_id = p.category_id
    WHERE ${IN_RANGE} GROUP BY p.p_id, p.p_name, c.name ORDER BY revenue DESC`);
  // busiest weekday x hour
  const heat = await q(`
    SELECT EXTRACT(DOW FROM s."createdAt" AT TIME ZONE '${TZ}')::int AS dow, EXTRACT(HOUR FROM s."createdAt" AT TIME ZONE '${TZ}')::int AS hour, SUM(${REV}) AS revenue
    ${FROM} WHERE ${IN_RANGE} GROUP BY 1, 2`);
  // current stock vs each product's reorder level
  const stockLevels = await q(`
    SELECT p.p_id, p.p_name, st.s_quantity AS qty, p.reorder_level
    FROM products p JOIN stocks st ON st.p_id = p.p_id
    WHERE p.is_active ${productId ? "AND p.p_id = :productId" : ""} ${categoryId ? "AND p.category_id = :categoryId" : ""} ORDER BY st.s_quantity::float / GREATEST(p.reorder_level, 1)`);
  // last 12 calendar months, independent of the date filter (a long-term view)
  const monthly = await q(`
    SELECT to_char(m, 'Mon YY') AS label, COALESCE(SUM(x.rev),0) AS revenue, COALESCE(SUM(x.rev - x.cost),0) AS profit
    FROM generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') m
    LEFT JOIN (SELECT ${REV} AS rev, ${COST} AS cost, s."createdAt" AS at ${FROM} WHERE 1=1${ONLY}) x
           ON date_trunc('month', x.at) = m
    GROUP BY m ORDER BY m`);
  // revenue per category in each day/week of the selected period (category mix over time)
  const categoryTrend = await q(`
    SELECT to_char(date_trunc('${bucket}', s."createdAt"), ${bucket === "day" ? "'Mon DD'" : "'\"Wk of\" Mon DD'"}) AS day,
           COALESCE(c.name, 'Uncategorized') AS category, SUM(${REV}) AS revenue
    ${FROM} LEFT JOIN categories c ON c.category_id = p.category_id
    WHERE ${IN_RANGE} GROUP BY 1, date_trunc('${bucket}', s."createdAt"), 2`);
  const lowStock = await q(`
    SELECT p.p_id, p.p_name, st.s_quantity FROM products p JOIN stocks st ON st.p_id = p.p_id
    WHERE p.is_active AND st.s_quantity <= p.reorder_level ${productId ? "AND p.p_id = :productId" : ""} ${categoryId ? "AND p.category_id = :categoryId" : ""} ORDER BY st.s_quantity ASC LIMIT 8`);
  const [exp] = await q(`
    SELECT COALESCE(SUM(e.quantity * p.p_cost),0) AS loss, COALESCE(SUM(e.quantity),0) AS units
    FROM expires e JOIN products p ON p.p_id = e.p_id
    WHERE e."createdAt" >= :from AND e."createdAt" < :toExcl ${productId ? "AND e.p_id = :productId" : ""} ${categoryId ? "AND p.category_id = :categoryId" : ""}`);
  const [stockValue] = await q(`
    SELECT COALESCE(SUM(st.s_quantity * p.p_cost),0) AS value FROM stocks st JOIN products p ON p.p_id = st.p_id WHERE p.is_active ${productId ? "AND p.p_id = :productId" : ""} ${categoryId ? "AND p.category_id = :categoryId" : ""}`);

  const n = (v) => Number(v) || 0;
  const iso = (d) => d.toISOString().slice(0, 10);
  return {
    range: { from: iso(from), to: iso(to), days, bucket, first_sale: first ? iso(new Date(first)) : null },
    totals: {
      revenue: n(totals.revenue), profit: n(totals.revenue) - n(totals.cost), units: n(totals.units), orders: n(totals.orders),
      expired_loss: n(exp.loss), expired_units: n(exp.units), stock_value: n(stockValue.value),
    },
    growth_pct: n(prev.revenue) ? ((n(totals.revenue) - n(prev.revenue)) / n(prev.revenue)) * 100 : null,
    daily: daily.map((d, i) => ({
      day: d.day, revenue: n(d.revenue), profit: n(d.profit), orders: n(d.orders),
      prev_revenue: prevDaily[i] ? n(prevDaily[i].revenue) : null,   // same position in the previous period
    })),
    by_category: byCategory.map((r) => ({ category: r.category, revenue: n(r.revenue), profit: n(r.profit) })),
    top_products: topProducts.map((r) => ({ name: r.p_name, revenue: n(r.revenue), units: n(r.units) })),
    products: productStats.map((r) => ({ p_id: r.p_id, name: r.p_name, category: r.category, revenue: n(r.revenue), profit: n(r.profit), units: n(r.units) })),
    monthly: monthly.map((r) => ({ label: r.label, revenue: n(r.revenue), profit: n(r.profit) })),
    category_trend: categoryTrend.map((r) => ({ day: r.day, category: r.category, revenue: n(r.revenue) })),
    heatmap: heat.map((r) => ({ dow: r.dow, hour: r.hour, revenue: n(r.revenue) })),
    stock_levels: stockLevels.map((r) => ({ p_id: r.p_id, name: r.p_name, qty: n(r.qty), reorder: n(r.reorder_level) })),
    by_weekday: byWeekday.map((r) => ({ dow: r.dow, revenue: n(r.revenue) })),
    low_stock: lowStock,
  };
}


// ---------- Inventory analytics (stock health, flow, waste) ----------
export async function getInventoryAnalytics() {
  const q = async (sql) => (await sequelize.query(sql))[0];
  const n = (v) => Number(v) || 0;

  // how many days the current stock will last at the last-30-days sales pace
  const cover = await q(`
    SELECT p.p_id, p.p_name, st.s_quantity AS qty, p.reorder_level, COALESCE(v.units, 0) / 30.0 AS per_day
    FROM products p JOIN stocks st ON st.p_id = p.p_id
    LEFT JOIN (SELECT p_id, SUM(quantity) AS units FROM sales WHERE "createdAt" >= now() - interval '30 days' GROUP BY p_id) v ON v.p_id = p.p_id
    WHERE p.is_active`);
  // weekly flow for the last 12 weeks: delivered vs sold vs written off
  const flow = await q(`
    SELECT to_char(ax.wk, 'Mon DD') AS week, COALESCE(i.u, 0) AS delivered, COALESCE(s.u, 0) AS sold, COALESCE(e.u, 0) AS expired
    FROM generate_series(date_trunc('week', current_date) - interval '11 weeks', date_trunc('week', current_date), interval '1 week') AS ax(wk)
    LEFT JOIN (SELECT date_trunc('week', "createdAt") AS wk, SUM(imp_quantity) AS u FROM imports GROUP BY 1) i ON i.wk = ax.wk
    LEFT JOIN (SELECT date_trunc('week', "createdAt") AS wk, SUM(quantity) AS u FROM sales GROUP BY 1) s ON s.wk = ax.wk
    LEFT JOIN (SELECT date_trunc('week', "createdAt") AS wk, SUM(quantity) AS u FROM expires GROUP BY 1) e ON e.wk = ax.wk
    ORDER BY ax.wk`);
  const waste = await q(`
    SELECT p.p_name, SUM(e.quantity) AS units, SUM(e.quantity * p.p_cost) AS loss
    FROM expires e JOIN products p ON p.p_id = e.p_id GROUP BY p.p_name ORDER BY loss DESC LIMIT 8`);
  const valueByCategory = await q(`
    SELECT COALESCE(c.name, 'Uncategorized') AS category, SUM(st.s_quantity * p.p_cost) AS value
    FROM stocks st JOIN products p ON p.p_id = st.p_id LEFT JOIN categories c ON c.category_id = p.category_id
    WHERE p.is_active GROUP BY 1 ORDER BY 2 DESC`);

  return {
    cover: cover.map((r) => ({
      name: r.p_name, qty: n(r.qty), reorder: n(r.reorder_level), per_day: n(r.per_day),
      days: n(r.per_day) > 0 ? n(r.qty) / n(r.per_day) : null,       // null = no recent sales
    })),
    flow: flow.map((r) => ({ week: r.week, delivered: n(r.delivered), sold: n(r.sold), expired: n(r.expired) })),
    waste: waste.map((r) => ({ name: r.p_name, units: n(r.units), loss: n(r.loss) })),
    value_by_category: valueByCategory.map((r) => ({ category: r.category, value: n(r.value) })),
  };
}


// ---------- Bulk input (cart checkout and CSV import) ----------
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(`${d}T00:00:00Z`).getTime());

/**
 * Record many sale lines at once, all or nothing.
 * items: [{ p_id | p_name, quantity, date? }]. `date` (YYYY-MM-DD) back-dates a sale (used by CSV import).
 * Stock is checked per product across ALL lines, so two lines of the same product cannot oversell.
 */
export async function saleBatch(items) {
  return sequelize.transaction(async (t) => {
    const errors = [];
    const ids = new Set();
    const resolved = [];
    const today = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const row = i + 1;
      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty <= 0) { errors.push({ row, message: "Quantity must be a whole number above 0" }); continue; }
      if (it.date && (!isDate(it.date) || it.date > today)) { errors.push({ row, message: "Date must be YYYY-MM-DD and not in the future" }); continue; }
      const where = it.p_id ? { p_id: it.p_id } : Sequelize.where(Sequelize.fn("lower", Sequelize.col("p_name")), String(it.p_name || "").trim().toLowerCase());
      const product = await Product.findOne({ where: { [Sequelize.Op.and]: [where, { is_active: true }] }, transaction: t });
      if (!product) { errors.push({ row, message: `Product not found: ${it.p_name ?? it.p_id}` }); continue; }
      ids.add(product.p_id);
      resolved.push({ row, product, qty, date: it.date });
    }

    // lock the stock rows in a fixed order (no deadlocks) and check totals per product
    const stocks = new Map();
    for (const id of [...ids].sort((a, b) => a - b)) {
      stocks.set(id, await Stock.findOne({ where: { p_id: id }, transaction: t, lock: t.LOCK.UPDATE }));
    }
    const left = new Map([...stocks].map(([id, st]) => [id, st?.s_quantity ?? 0]));
    for (const r of resolved) {
      const have = left.get(r.product.p_id);
      if (have < r.qty) errors.push({ row: r.row, message: `Not enough stock for ${r.product.p_name} (have ${have}, need ${r.qty})` });
      else left.set(r.product.p_id, have - r.qty);
    }
    if (errors.length) return { success: false, errors };

    for (const [id, st] of stocks) { st.s_quantity = left.get(id); await st.save({ transaction: t }); }
    await Sale.bulkCreate(resolved.map((r) => ({
      p_id: r.product.p_id, quantity: r.qty, unit_price: r.product.p_price,
      createdAt: r.date && r.date !== today ? new Date(`${r.date}T12:00:00Z`) : new Date(),
    })), { transaction: t });

    return {
      success: true, lines: resolved.length,
      units: resolved.reduce((s, r) => s + r.qty, 0),
      total: Math.round(resolved.reduce((s, r) => s + r.qty * r.product.p_price, 0) * 100) / 100,
    };
  });
}

/**
 * Add or update many products at once (CSV import), all or nothing.
 * rows: [{ p_name, category?, p_price, p_cost?, stock?, reorder_level? }]
 * A product that already exists (same name) gets its price/cost/type updated and the stock is ADDED as a delivery.
 */
export async function importProducts(rows) {
  return sequelize.transaction(async (t) => {
    const errors = [];
    const clean = [];
    const blank = (v) => v === undefined || v === null || v === "";
    const seen = new Set();
    rows.forEach((r, i) => {
      const row = i + 1;
      const name = cleanText(r.p_name, LIMITS.name);
      // a blank cost / low-stock level means "leave what we have"; it must NOT reset an existing product to 0
      const price = toMoneyLoose(r.p_price);
      const cost = blank(r.p_cost) ? undefined : toMoneyLoose(r.p_cost);
      const stock = blank(r.stock) ? 0 : toInt(typeof r.stock === "string" ? r.stock.trim() : r.stock);
      const reorder = blank(r.reorder_level) ? undefined : toInt(typeof r.reorder_level === "string" ? r.reorder_level.trim() : r.reorder_level);
      const category = blank(r.category) ? "" : cleanText(r.category, LIMITS.category);
      if (!name) errors.push({ row, message: "Product name is missing or too long" });
      else if (seen.has(name.toLowerCase())) errors.push({ row, message: `"${name}" appears twice` });
      else if (Number.isNaN(price) || price > LIMITS.price) errors.push({ row, message: `Price is not valid for ${name}` });
      else if (cost !== undefined && (Number.isNaN(cost) || cost > LIMITS.price)) errors.push({ row, message: `Cost is not valid for ${name}` });
      else if (Number.isNaN(stock) || stock > LIMITS.quantity) errors.push({ row, message: `Stock must be a whole number for ${name}` });
      else if (reorder !== undefined && Number.isNaN(reorder)) errors.push({ row, message: `Reorder level must be a whole number for ${name}` });
      else if (category === null) errors.push({ row, message: `Type name is too long for ${name}` });
      else { seen.add(name.toLowerCase()); clean.push({ name, category, price, cost, stock, reorder }); }
    });
    if (errors.length) return { success: false, errors };

    let created = 0, updated = 0, stockAdded = 0;
    for (const r of clean) {
      let category_id = null;
      if (r.category) {
        const [cat] = await Category.findOrCreate({ where: { name: r.category }, transaction: t });
        category_id = cat.category_id;
      }
      let product = await Product.findOne({ where: Sequelize.where(Sequelize.fn("lower", Sequelize.col("p_name")), r.name.toLowerCase()), transaction: t });
      if (product) {
        await product.update({
          p_price: r.price, is_active: true,
          ...(r.cost !== undefined ? { p_cost: r.cost } : {}),
          ...(r.reorder !== undefined ? { reorder_level: r.reorder } : {}),
          ...(category_id ? { category_id } : {}),
        }, { transaction: t });
        updated++;
      } else {
        product = await Product.create({ p_name: r.name, p_price: r.price, p_cost: r.cost ?? 0, reorder_level: r.reorder ?? 10, category_id }, { transaction: t });
        await product.update({ sku: `SKU-${String(product.p_id).padStart(4, "0")}` }, { transaction: t });
        created++;
      }
      let stock = await Stock.findOne({ where: { p_id: product.p_id }, transaction: t, lock: t.LOCK.UPDATE });
      if (!stock) stock = await Stock.create({ p_id: product.p_id, s_quantity: 0 }, { transaction: t });
      if (r.stock > 0) {
        stock.s_quantity += r.stock; await stock.save({ transaction: t });
        await ImportProduct.create({ p_id: product.p_id, imp_quantity: r.stock, unit_cost: r.cost ?? product.p_cost }, { transaction: t });
        stockAdded += r.stock;
      }
    }
    return { success: true, created, updated, stock_added: stockAdded };
  });
}
