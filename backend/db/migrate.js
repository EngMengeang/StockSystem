import bcrypt from "bcryptjs";
import sequelize from "../ulits/database.js";

/**
 * Safe, repeatable upgrade steps for databases created by earlier versions.
 * Runs around `sequelize.sync({ alter: true })` on every start; each step does nothing if already applied.
 */
const q = (sql) => sequelize.query(sql);
const tableExists = async (t) => (await q(`SELECT to_regclass('public.${t}') AS t`))[0][0].t !== null;
const columnExists = async (t, c) =>
  (await q(`SELECT 1 FROM information_schema.columns WHERE table_name='${t}' AND column_name='${c}'`))[0].length > 0;

/** Before sync: make old data fit the stricter new columns. (sync would drop columns it no longer knows, so move data first.) */
export async function beforeSync() {
  // product.category (free text) -> categories table + products.category_id
  if ((await tableExists("products")) && (await columnExists("products", "category"))) {
    await q(`CREATE TABLE IF NOT EXISTS categories (category_id SERIAL PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE)`);
    await q(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER`);
    await q(`INSERT INTO categories (name) SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category <> '' ON CONFLICT (name) DO NOTHING`);
    await q(`UPDATE products p SET category_id = c.category_id FROM categories c WHERE c.name = p.category`);
    await q(`ALTER TABLE products DROP COLUMN category`);
  }
  // new "created at" columns: add them ourselves WITH a default so existing rows get a date
  for (const t of ["products", "imports", "expires"]) {
    if (await tableExists(t)) await q(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()`);
  }
  // payment method is no longer tracked
  if (await tableExists("sales")) await q(`ALTER TABLE sales DROP COLUMN IF EXISTS payment_method`);
  // every sale must have a price: fill old rows from the product's current price
  if ((await tableExists("sales")) && (await columnExists("sales", "unit_price"))) {
    await q(`UPDATE sales s SET unit_price = p.p_price FROM products p WHERE p.p_id = s.p_id AND s.unit_price IS NULL`);
  }
}

/** After sync: move data into the new structure and add database-level safety rules. */
export async function afterSync() {
  // 2) SKU for every product
  await q(`UPDATE products SET sku = 'SKU-' || LPAD(p_id::text, 4, '0') WHERE sku IS NULL`);
  // 3) imports remember what they cost
  await q(`UPDATE imports i SET unit_cost = p.p_cost FROM products p WHERE p.p_id = i.p_id AND i.unit_cost IS NULL`);

  // 4) rules the database enforces itself (so bad data can never get in, whatever the app does)
  const rules = [
    ["products", "products_price_nonneg", "p_price >= 0"],
    ["products", "products_cost_nonneg", "p_cost >= 0"],
    ["products", "products_reorder_nonneg", "reorder_level >= 0"],
    ["stocks", "stocks_qty_nonneg", "s_quantity >= 0"],
    ["sales", "sales_qty_positive", "quantity > 0"],
    ["sales", "sales_price_nonneg", "unit_price >= 0"],
    ["imports", "imports_qty_positive", "imp_quantity > 0"],
    ["expires", "expires_qty_positive", "quantity > 0"],
  ];
  for (const [table, name, check] of rules) {
    const exists = (await q(`SELECT 1 FROM pg_constraint WHERE conname = '${name}'`))[0].length > 0;
    if (!exists) await q(`ALTER TABLE ${table} ADD CONSTRAINT ${name} CHECK (${check}) NOT VALID`);
  }

  // 5) no two products may share a name (ignoring capitals): CSV import and the sale screens look products up by name
  try {
    await q(`CREATE UNIQUE INDEX IF NOT EXISTS products_name_ci_unique ON products (lower(p_name))`);
  } catch {
    console.warn("⚠️  Two products already share a name, so the unique-name rule was not added. Rename or delete the duplicate and restart.");
  }

  // 6) passwords are stored as hashes, never as readable text
  if (await tableExists("userschema")) {
    const plain = (await q(`SELECT id, password FROM userschema WHERE password NOT LIKE '$2%'`))[0];
    for (const u of plain) {
      await sequelize.query("UPDATE userschema SET password = $1 WHERE id = $2", { bind: [await bcrypt.hash(String(u.password), 10), u.id] });
    }
    if (plain.length) console.log(`🔒 Hashed ${plain.length} plain-text password(s).`);
  }
}
