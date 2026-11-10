/**
 * End-to-end tests for the API, run against the REAL running server and database.
 *
 *   1. start the API:   npm start
 *   2. run the tests:   npm run test:api
 *
 * Everything the tests create is prefixed "QA " and removed again at the end.
 * They log in with a temporary user created just for the run (nothing to configure).
 */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import sequelize from "../ulits/database.js";

const API = process.env.API_URL || "http://localhost:4000/api";
const USER = "qa_tester";
const PASS = "qa-Test-123";
let token = "";

const call = async (method, path, body, { auth = true } = {}) => {
  const res = await fetch(API + path, {
    method,
    headers: { "content-type": "application/json", ...(auth && token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
};
const sql = async (q, replacements) => (await sequelize.query(q, { replacements, type: sequelize.QueryTypes.SELECT }));
const stockOf = async (name) => (await sql("SELECT s.s_quantity AS q FROM products p JOIN stocks s ON s.p_id = p.p_id WHERE p.p_name = :name", { name }))[0]?.q;
const idOf = async (name) => (await sql("SELECT p_id FROM products WHERE p_name = :name", { name }))[0]?.p_id;
const today = new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

async function cleanup() {
  await sequelize.query(`DELETE FROM sales WHERE p_id IN (SELECT p_id FROM products WHERE p_name LIKE 'QA %')`);
  await sequelize.query(`DELETE FROM products WHERE p_name LIKE 'QA %'`);
  await sequelize.query(`DELETE FROM categories WHERE name LIKE 'QA %'`);
  await sequelize.query(`DELETE FROM userschema WHERE username = '${USER}'`);
}

before(async () => {
  try { await fetch(API + "/health"); } catch { throw new Error(`The API is not running at ${API}. Start it with "npm start" first.`); }
  await cleanup();
  await sequelize.query("INSERT INTO userschema (username, password) VALUES ($1, $2)", { bind: [USER, await bcrypt.hash(PASS, 10)] });
  const r = await call("POST", "/login", { username: USER, password: PASS }, { auth: false });
  token = r.body.token;
});
after(async () => { await cleanup(); await sequelize.close(); });

// ------------------------------------------------------------------ auth
test("auth: correct login returns a token, wrong ones are rejected with 401/400 (never 500)", async () => {
  assert.equal((await call("POST", "/login", { username: USER, password: PASS }, { auth: false })).status, 200);
  assert.equal((await call("POST", "/login", { username: USER, password: "nope" }, { auth: false })).status, 401);
  assert.equal((await call("POST", "/login", { username: "ghost", password: "x" }, { auth: false })).status, 401);
  assert.equal((await call("POST", "/login", {}, { auth: false })).status, 400);
  assert.equal((await call("POST", "/login", { username: { $ne: 1 }, password: ["x"] }, { auth: false })).status, 400);
  assert.equal((await call("POST", "/login", "{not json", { auth: false })).status, 400);
});

test("auth: data routes need a valid token; /health does not", async () => {
  for (const [m, p] of [["GET", "/products"], ["GET", "/analytics/overview"], ["POST", "/sales/batch"], ["POST", "/products"]]) {
    assert.equal((await call(m, p, m === "GET" ? undefined : {}, { auth: false })).status, 401, `${m} ${p}`);
  }
  const bad = await fetch(API + "/products", { headers: { authorization: "Bearer garbage" } });
  assert.equal(bad.status, 401);
  assert.equal((await call("GET", "/health", undefined, { auth: false })).status, 200);
});

test("auth: passwords are stored hashed, not readable", async () => {
  const [row] = await sql("SELECT password FROM userschema WHERE username = :u", { u: USER });
  assert.match(row.password, /^\$2[aby]\$/);
});

test("errors are always JSON (unknown route, bad body)", async () => {
  const r = await call("GET", "/definitely-not-a-route");
  assert.equal(r.status, 404);
  assert.equal(typeof r.body.message, "string");
});

// ------------------------------------------------------------------ products
test("products: create validates every field and never answers 500 for bad input", async () => {
  const bads = [
    {}, { p_price: 5 }, { p_name: "QA x", p_price: -1 }, { p_name: "QA x", p_price: "abc" }, { p_name: "QA x", p_price: 5, imp_quantity: -3 },
    { p_name: "QA x", p_price: 5, imp_quantity: 1.5 }, { p_name: "Q".repeat(300), p_price: 5 }, { p_name: "QA x", p_price: 5, reorder_level: -2 },
    { p_name: "QA x", p_price: 5, category_id: "abc" }, { p_name: "QA x", p_price: 1e12 }, { p_name: "   ", p_price: 5 },
  ];
  for (const b of bads) {
    const r = await call("POST", "/products", b);
    assert.equal(r.status, 400, JSON.stringify(b));
  }
  assert.equal(await idOf("QA x"), undefined, "nothing was created by the bad requests");
});

test("products: create makes the product, its stock row, an SKU and a delivery record", async () => {
  const r = await call("POST", "/products", { p_name: "QA Phone", p_price: 100, p_cost: 60, imp_quantity: 12, reorder_level: 3 });
  assert.equal(r.status, 200);
  const [p] = await sql("SELECT p.*, s.s_quantity, (SELECT SUM(imp_quantity) FROM imports i WHERE i.p_id = p.p_id) AS delivered FROM products p JOIN stocks s ON s.p_id = p.p_id WHERE p_name = 'QA Phone'");
  assert.equal(p.s_quantity, 12);
  assert.equal(Number(p.delivered), 12);
  assert.equal(p.p_cost, 60);
  assert.equal(p.reorder_level, 3);
  assert.match(p.sku, /^SKU-\d{4}$/);
});

test("products: the same name (even in other capitals) adds stock instead of making a duplicate", async () => {
  const r = await call("POST", "/products", { p_name: "qa PHONE ", p_price: 110, imp_quantity: 5 });   // other capitals + a trailing space
  assert.equal(r.status, 200);
  assert.equal(await stockOf("QA Phone"), 17);
  assert.equal((await sql("SELECT COUNT(*)::int AS n FROM products WHERE lower(p_name) = 'qa phone'"))[0].n, 1);
  // a direct second row with different capitals is stopped by the database itself
  await assert.rejects(sequelize.query("INSERT INTO products (p_name, p_price, p_cost, reorder_level, is_active, \"createdAt\") VALUES ('QA PHONE', 1, 0, 1, true, now())"));
});

test("products: 8 requests creating the same new product at the same moment make ONE product and lose no stock", async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => call("POST", "/products", { p_name: "QA Twin", p_price: 9, imp_quantity: 1 })));
  assert.ok(results.every((r) => [200, 409].includes(r.status)), "only success or a clean 409, never 500: " + results.map((r) => r.status));
  assert.equal((await sql("SELECT COUNT(*)::int AS n FROM products WHERE lower(p_name) = 'qa twin'"))[0].n, 1);
  assert.equal(await stockOf("QA Twin"), results.filter((r) => r.status === 200).length, "stock equals the number of accepted requests");
});

test("products: update validates, and cannot rename onto another product's name", async () => {
  await call("POST", "/products", { p_name: "QA Tablet", p_price: 50, imp_quantity: 1 });
  const id = await idOf("QA Tablet");
  assert.equal((await call("PUT", "/products/abc", { p_price: 1 })).status, 400);
  assert.equal((await call("PUT", "/products/9999999", { p_price: 1 })).status, 404);
  assert.equal((await call("PUT", `/products/${id}`, { p_price: -5 })).status, 400);
  assert.equal((await call("PUT", `/products/${id}`, { p_name: "qa phone" })).status, 409);
  assert.equal((await call("PUT", `/products/${id}`, { p_price: 55, p_cost: 30 })).status, 200);
  const [p] = await sql("SELECT p_price, p_cost FROM products WHERE p_id = :id", { id });
  assert.deepEqual([p.p_price, p.p_cost], [55, 30]);
});

test("products: deleting one with no sales removes it; one with sales is hidden and keeps its history", async () => {
  await call("POST", "/products", { p_name: "QA Gone", p_price: 5, imp_quantity: 2 });
  const gone = await idOf("QA Gone");
  assert.equal((await call("DELETE", "/products/abc")).status, 400);
  assert.equal((await call("DELETE", `/products/${gone}`)).body.deactivated, false);
  assert.equal(await idOf("QA Gone"), undefined);

  await call("POST", "/products", { p_name: "QA Keep", p_price: 5, imp_quantity: 2 });
  assert.equal((await call("POST", "/products/sale", { p_name: "QA Keep", quantity: 1 })).status, 200);
  const keep = await idOf("QA Keep");
  assert.equal((await call("DELETE", `/products/${keep}`)).body.deactivated, true);
  const list = (await call("GET", "/products")).body;
  assert.ok(!list.some((p) => p.p_name === "QA Keep"), "hidden from the product list");
  assert.equal((await call("POST", "/products/sale", { p_name: "QA Keep", quantity: 1 })).status, 400, "cannot be sold any more");
  assert.equal((await sql("SELECT COUNT(*)::int AS n FROM sales WHERE p_id = :keep", { keep }))[0].n, 1, "its past sale is still there");
});

// ------------------------------------------------------------------ selling
test("sale: reduces stock by exactly the quantity and stores the price at that moment", async () => {
  await call("POST", "/products", { p_name: "QA Watch", p_price: 200, p_cost: 120, imp_quantity: 10 });
  const r = await call("POST", "/products/sale", { p_name: "QA Watch", quantity: 3 });
  assert.equal(r.status, 200);
  assert.equal(r.body.remaining_stock, 7);
  assert.equal(await stockOf("QA Watch"), 7);
  // raising the price later must not change what the old sale was worth
  await call("PUT", `/products/${await idOf("QA Watch")}`, { p_price: 999 });
  const [s] = await sql("SELECT unit_price FROM sales WHERE p_id = (SELECT p_id FROM products WHERE p_name = 'QA Watch')");
  assert.equal(s.unit_price, 200);
});

test("sale: bad quantities are rejected and stock never changes", async () => {
  const before = await stockOf("QA Watch");
  for (const quantity of [0, -1, 1.5, "2", null, 1e9]) {
    assert.equal((await call("POST", "/products/sale", { p_name: "QA Watch", quantity })).status, 400, String(quantity));
  }
  assert.equal((await call("POST", "/products/sale", { p_name: "QA Watch", quantity: before + 1 })).status, 400, "more than in stock");
  assert.equal((await call("POST", "/products/sale", { p_name: "Nope Nope", quantity: 1 })).status, 400);
  assert.equal(await stockOf("QA Watch"), before);
});

test("sale: can sell the very last unit, then refuses further sales (stock hits 0, never below)", async () => {
  await call("POST", "/products", { p_name: "QA Last", p_price: 10, imp_quantity: 1 });
  assert.equal((await call("POST", "/products/sale", { p_name: "QA Last", quantity: 1 })).body.remaining_stock, 0);
  assert.equal((await call("POST", "/products/sale", { p_name: "QA Last", quantity: 1 })).status, 400);
  assert.equal(await stockOf("QA Last"), 0);
});

test("sale: 12 simultaneous sales of a product with 5 in stock — exactly 5 succeed", async () => {
  await call("POST", "/products", { p_name: "QA Race", p_price: 10, imp_quantity: 5 });
  const results = await Promise.all(Array.from({ length: 12 }, () => call("POST", "/products/sale", { p_name: "QA Race", quantity: 1 })));
  assert.equal(results.filter((r) => r.status === 200).length, 5);
  assert.equal(results.filter((r) => r.status === 400).length, 7);
  assert.equal(await stockOf("QA Race"), 0);
  assert.equal((await sql("SELECT COUNT(*)::int AS n FROM sales WHERE p_id = (SELECT p_id FROM products WHERE p_name = 'QA Race')"))[0].n, 5);
});

test("batch: all-or-nothing. One bad row means nothing is saved and no stock moves", async () => {
  await call("POST", "/products", { p_name: "QA B1", p_price: 10, imp_quantity: 5 });
  await call("POST", "/products", { p_name: "QA B2", p_price: 20, imp_quantity: 5 });
  const r = await call("POST", "/sales/batch", { items: [{ p_name: "QA B1", quantity: 2 }, { p_name: "QA B2", quantity: 99 }, { p_name: "QA Missing", quantity: 1 }] });
  assert.equal(r.status, 400);
  assert.equal(r.body.errors.length, 2);
  assert.deepEqual([await stockOf("QA B1"), await stockOf("QA B2")], [5, 5]);
  assert.equal((await sql("SELECT COUNT(*)::int AS n FROM sales WHERE p_id IN (SELECT p_id FROM products WHERE p_name IN ('QA B1','QA B2'))"))[0].n, 0);
});

test("batch: lines of the same product are added up before checking stock", async () => {
  const r = await call("POST", "/sales/batch", { items: [{ p_name: "QA B1", quantity: 3 }, { p_name: "qa b1", quantity: 3 }] });
  assert.equal(r.status, 400, "3 + 3 is more than the 5 in stock");
  assert.equal(await stockOf("QA B1"), 5);
  const ok = await call("POST", "/sales/batch", { items: [{ p_name: "QA B1", quantity: 2 }, { p_name: "QA B1", quantity: 3 }] });
  assert.equal(ok.status, 200);
  assert.equal(await stockOf("QA B1"), 0);
});

test("batch: totals are right, dates can be in the past, but not in the future or impossible", async () => {
  await call("POST", "/products", { p_name: "QA B3", p_price: 12.5, imp_quantity: 10 });
  const ok = await call("POST", "/sales/batch", { items: [{ p_name: "QA B3", quantity: 2, date: daysAgo(5) }, { p_id: await idOf("QA B3"), quantity: 1 }] });
  assert.equal(ok.status, 200);
  assert.deepEqual([ok.body.lines, ok.body.units, ok.body.total], [2, 3, 37.5]);
  const dates = (await sql("SELECT \"createdAt\"::date::text AS d FROM sales WHERE p_id = :id ORDER BY sale_id", { id: await idOf("QA B3") })).map((x) => x.d);
  assert.equal(dates[0], daysAgo(5));
  for (const date of ["2999-01-01", "2026-02-31", "11/05/2026", "yesterday"]) {
    assert.equal((await call("POST", "/sales/batch", { items: [{ p_name: "QA B3", quantity: 1, date }] })).status, 400, date);
  }
  assert.equal(await stockOf("QA B3"), 7);
});

test("batch: malformed input never gives a 500", async () => {
  for (const body of [{}, { items: [] }, { items: "x" }, { items: [null] }, { items: [1] }, { items: [{}] }, { items: [{ p_id: "1; DROP TABLE sales", quantity: 1 }] },
    { items: [{ p_name: "QA B3", quantity: "1" }] }, { items: Array.from({ length: 2001 }, () => ({ p_name: "QA B3", quantity: 1 })) }]) {
    assert.equal((await call("POST", "/sales/batch", body)).status, 400, JSON.stringify(body).slice(0, 60));
  }
});

// ------------------------------------------------------------------ CSV product import
test("import: creates new products, updates existing ones and ADDS stock as a delivery", async () => {
  const r = await call("POST", "/products/import", { rows: [
    { p_name: "QA Imp New", category: "QA Type", p_price: "1,299.00", p_cost: "$900", stock: "4", reorder_level: "2" },
    { p_name: "qa phone", p_price: 120, stock: 3 },
  ] });
  assert.deepEqual([r.status, r.body.created, r.body.updated, r.body.stock_added], [200, 1, 1, 7]);
  const [n] = await sql("SELECT p.p_price, p.p_cost, p.reorder_level, c.name AS type, s.s_quantity FROM products p JOIN stocks s USING (p_id) LEFT JOIN categories c USING (category_id) WHERE p_name = 'QA Imp New'");
  assert.deepEqual([n.p_price, n.p_cost, n.reorder_level, n.type, n.s_quantity], [1299, 900, 2, "QA Type", 4]);
  assert.equal(await stockOf("QA Phone"), 20);
});

test("import: a blank cost / low-stock level keeps the existing values (does not reset them to 0)", async () => {
  const before = (await sql("SELECT p_cost, reorder_level FROM products WHERE p_name = 'QA Phone'"))[0];
  assert.deepEqual([before.p_cost, before.reorder_level], [60, 3]);
  const r = await call("POST", "/products/import", { rows: [{ p_name: "QA Phone", p_price: 130, p_cost: "", reorder_level: "", stock: "" }] });
  assert.equal(r.status, 200);
  const after = (await sql("SELECT p_price, p_cost, reorder_level FROM products WHERE p_name = 'QA Phone'"))[0];
  assert.deepEqual([after.p_price, after.p_cost, after.reorder_level], [130, 60, 3]);
});

test("import: all-or-nothing, with a clear row number for each problem", async () => {
  const r = await call("POST", "/products/import", { rows: [
    { p_name: "QA Imp Ok", p_price: 5, stock: 1 }, { p_name: "", p_price: 5 }, { p_name: "QA Imp Bad", p_price: "free" },
    { p_name: "QA Imp Neg", p_price: 5, stock: -1 }, { p_name: "QA Imp Ok", p_price: 6 },
  ] });
  assert.equal(r.status, 400);
  assert.deepEqual(r.body.errors.map((e) => e.row), [2, 3, 4, 5]);
  assert.equal(await idOf("QA Imp Ok"), undefined, "the valid first row was NOT saved either");
  for (const body of [{ rows: [] }, { rows: [null] }, { rows: "x" }, {}]) assert.equal((await call("POST", "/products/import", body)).status, 400);
});

// ------------------------------------------------------------------ categories
test("categories: empty or oversized names are refused; the same name is not duplicated", async () => {
  assert.equal((await call("POST", "/categories", { name: "  " })).status, 400);
  assert.equal((await call("POST", "/categories", { name: "c".repeat(200) })).status, 400);
  const a = await call("POST", "/categories", { name: "QA Cat" });
  const b = await call("POST", "/categories", { name: "QA Cat" });
  assert.equal(a.body.category_id, b.body.category_id);
});

// ------------------------------------------------------------------ dashboard numbers
test("overview: parameters are validated", async () => {
  for (const q of ["from=bad", "to=2026-13-01", "from=2026-02-31", "from=2026-11-10&to=2026-10-01", "product_id=abc", "product_id=1;DROP", "category_id=-1", "from=2026-10-01&from=2026-10-02"]) {
    assert.equal((await call("GET", `/analytics/overview?${q}`)).status, 400, q);
  }
});

test("overview: the headline numbers match the database exactly", async () => {
  const from = daysAgo(29), to = today;
  const { body: o } = await call("GET", `/analytics/overview?from=${from}&to=${to}`);
  const [db] = await sql(`SELECT COALESCE(SUM(s.quantity * s.unit_price),0) AS revenue, COALESCE(SUM(s.quantity * p.p_cost),0) AS cost, COALESCE(SUM(s.quantity),0) AS units, COUNT(*) AS n
                          FROM sales s JOIN products p ON p.p_id = s.p_id WHERE s."createdAt" >= :from AND s."createdAt" < (CAST(:to AS date) + 1)`, { from, to });
  const near = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} vs ${b}`);
  near(o.totals.revenue, db.revenue); near(o.totals.profit, db.revenue - db.cost);
  assert.equal(o.totals.units, Number(db.units)); assert.equal(o.totals.orders, Number(db.n));
  // the same money, split several different ways, must add up to the same total
  near(o.daily.reduce((s, d) => s + d.revenue, 0), o.totals.revenue);
  near(o.by_category.reduce((s, c) => s + c.revenue, 0), o.totals.revenue);
  near(o.products.reduce((s, p) => s + p.revenue, 0), o.totals.revenue);
  near(o.heatmap.reduce((s, h) => s + h.revenue, 0), o.totals.revenue);
  near(o.by_weekday.reduce((s, h) => s + h.revenue, 0), o.totals.revenue);
  near(o.daily.reduce((s, d) => s + d.profit, 0), o.totals.profit);
  assert.equal(o.daily.length, 30, "one point per day, including days with no sales");
});

test("overview: product and type filters narrow every number consistently", async () => {
  const pid = await idOf("QA B3");
  const { body: one } = await call("GET", `/analytics/overview?from=${daysAgo(30)}&to=${today}&product_id=${pid}`);
  assert.equal(one.totals.revenue, 37.5);                      // 3 x 12.50 from the batch test
  assert.equal(one.products.length, 1);
  assert.equal(one.stock_levels.length, 1);
  const cat = (await sql("SELECT category_id FROM categories WHERE name = 'QA Type'"))[0].category_id;
  const { body: typed } = await call("GET", `/analytics/overview?from=${daysAgo(30)}&to=${today}&category_id=${cat}`);
  assert.equal(typed.totals.revenue, 0, "the QA Type product has no sales");
  assert.equal(typed.stock_levels.length, 1);
  assert.equal(typed.by_category.length, 0);
});

test("overview: a period with no sales is empty but complete (no crash, growth is null)", async () => {
  const { status, body: o } = await call("GET", "/analytics/overview?from=2001-01-01&to=2001-01-31");
  assert.equal(status, 200);
  assert.equal(o.totals.revenue, 0);
  assert.equal(o.growth_pct, null);
  assert.equal(o.products.length, 0);
  assert.ok(o.daily.length > 0 && o.daily.every((d) => d.revenue === 0));
  assert.ok(Array.isArray(o.stock_levels) && Array.isArray(o.low_stock));
});

test("overview: a future end date is cut at today; long ranges are grouped by week", async () => {
  const { body: o } = await call("GET", `/analytics/overview?from=${daysAgo(10)}&to=2999-12-31`);
  assert.equal(o.range.to, today);
  const { body: long } = await call("GET", `/analytics/overview?from=${daysAgo(200)}&to=${today}`);
  assert.equal(long.range.bucket, "week");
  const { body: short } = await call("GET", `/analytics/overview?from=${daysAgo(20)}&to=${today}`);
  assert.equal(short.range.bucket, "day");
});

test("overview: low-stock uses each product's own level, and a hidden product is left out", async () => {
  await call("POST", "/products", { p_name: "QA Low", p_price: 5, imp_quantity: 4, reorder_level: 4 });
  await call("POST", "/products", { p_name: "QA Fine", p_price: 5, imp_quantity: 5, reorder_level: 4 });
  const { body: o } = await call("GET", "/analytics/overview");
  const low = o.low_stock.map((x) => x.p_name);
  assert.ok(low.includes("QA Low"), "4 in stock, level 4: counts as low");
  assert.ok(!low.includes("QA Fine"), "5 in stock, level 4: fine");
  assert.ok(!low.includes("QA Keep"), "hidden products never show");
});

test("inventory analytics: has the right shape and sensible values", async () => {
  const { status, body: a } = await call("GET", "/analytics/inventory");
  assert.equal(status, 200);
  assert.equal(a.flow.length, 12);
  assert.ok(a.cover.every((c) => c.days === null || c.days >= 0));
  assert.ok(a.waste.every((w) => w.loss >= 0));
});

test("legacy lists answer 200 with a list (never an error when empty)", async () => {
  for (const p of ["/products/sales", "/products/expired", "/products/inventory-summary"]) {
    const r = await call("GET", p);
    assert.equal(r.status, 200, p);
    assert.ok(Array.isArray(r.body), p);
  }
});

// ------------------------------------------------------------------ write-offs
test("write-off: moves ALL remaining stock to written-off, then refuses when there is none", async () => {
  await call("POST", "/products", { p_name: "QA Waste", p_price: 5, p_cost: 2, imp_quantity: 6 });
  const r = await call("POST", "/products/expire", { p_name: "QA Waste" });
  assert.deepEqual([r.status, r.body.expired_quantity], [200, 6]);
  assert.equal(await stockOf("QA Waste"), 0);
  assert.equal((await call("POST", "/products/expire", { p_name: "QA Waste" })).status, 400);
  assert.equal((await call("POST", "/products/expire", {})).status, 400);
});

// ------------------------------------------------------------------ database rules
test("database: refuses negative stock, zero-quantity sales and deleting a product that has sales", async () => {
  const id = await idOf("QA B3");
  await assert.rejects(sequelize.query("UPDATE stocks SET s_quantity = -1 WHERE p_id = :id", { replacements: { id } }));
  await assert.rejects(sequelize.query("INSERT INTO sales (quantity, p_id, unit_price, \"createdAt\", \"updatedAt\") VALUES (0, :id, 1, now(), now())", { replacements: { id } }));
  await assert.rejects(sequelize.query("DELETE FROM products WHERE p_id = :id", { replacements: { id } }));
});
