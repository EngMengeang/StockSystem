-- Demo data: an Apple reseller (iPhone, iPad, Mac, Apple Watch, Accessories).
--   psql -U postgres -d stocks -f sampleData.sql
-- WARNING: this REPLACES the products, categories, stock, deliveries, write-offs and sales in that database.
-- (It leaves the userschema login table alone.)

TRUNCATE sales, expires, imports, stocks, products, categories RESTART IDENTITY CASCADE;

-- 1) types (categories)
INSERT INTO categories (name) VALUES ('iPhone'), ('iPad'), ('Mac'), ('Apple Watch'), ('Accessories');

-- 2) catalogue: name, type, selling price, cost as a share of price, how popular it is, low-stock level
CREATE TEMP TABLE catalog (name text, cat text, price numeric, cost_ratio numeric, pop numeric, reorder int);
INSERT INTO catalog VALUES
 ('iPhone 16',            'iPhone',      799, 0.80, 10,  8),
 ('iPhone 16 Plus',       'iPhone',      899, 0.80,  5,  6),
 ('iPhone 16 Pro',        'iPhone',      999, 0.78,  8,  8),
 ('iPhone 16 Pro Max',    'iPhone',     1199, 0.78,  6,  6),
 ('iPhone SE',            'iPhone',      429, 0.82,  3,  5),
 ('iPad (10th gen)',      'iPad',        349, 0.82,  6,  6),
 ('iPad mini',            'iPad',        499, 0.80,  3,  5),
 ('iPad Air',             'iPad',        599, 0.80,  4,  5),
 ('iPad Pro 11"',         'iPad',        999, 0.78,  2.5, 4),
 ('MacBook Air 13"',      'Mac',         999, 0.80,  6,  5),
 ('MacBook Air 15"',      'Mac',        1199, 0.80,  3.5, 4),
 ('MacBook Pro 14"',      'Mac',        1599, 0.78,  3,  4),
 ('MacBook Pro 16"',      'Mac',        2499, 0.77,  1.5, 3),
 ('Mac mini',             'Mac',         599, 0.80,  2.5, 4),
 ('iMac 24"',             'Mac',        1299, 0.79,  1.5, 3),
 ('Mac Studio',           'Mac',        1999, 0.78,  0.8, 2),
 ('Apple Watch SE',       'Apple Watch', 249, 0.78,  4,  6),
 ('Apple Watch Series 10','Apple Watch', 399, 0.77,  5,  6),
 ('Apple Watch Ultra 2',  'Apple Watch', 799, 0.76,  2,  4),
 ('AirPods 4',            'Accessories', 129, 0.70,  9, 12),
 ('AirPods Pro 2',        'Accessories', 249, 0.70,  8, 10),
 ('Apple Pencil',         'Accessories', 129, 0.68,  4,  8),
 ('Magic Keyboard',       'Accessories', 299, 0.68,  2, 6),
 ('AirTag',               'Accessories',  29, 0.55,  9, 15),
 ('MagSafe Charger',      'Accessories',  39, 0.55,  7, 12);

INSERT INTO products (p_name, p_price, p_cost, category_id, reorder_level, sku, "createdAt")
SELECT c.name, c.price, ROUND(c.price * c.cost_ratio, 2), cat.category_id, c.reorder,
       'APL-' || LPAD((ROW_NUMBER() OVER ())::text, 4, '0'), now() - interval '100 days'
FROM catalog c JOIN categories cat ON cat.name = c.cat;
INSERT INTO stocks (s_quantity, p_id, "createdAt", "updatedAt") SELECT 0, p_id, now(), now() FROM products;

-- 3) ~90 days of sales: busier at weekends and slowly growing. Popular products sell more often.
--    Stored as UTC, opening hours 09:00-20:59.
INSERT INTO sales (quantity, p_id, unit_price, "createdAt", "updatedAt")
SELECT 1 + (random() < 0.15)::int + (random() < 0.05)::int, p.p_id, p.p_price,
       ((d::date)::timestamp + ((9 + random()*11)::int || ' hours')::interval + ((random()*59)::int || ' minutes')::interval) AT TIME ZONE 'UTC',
       now()
FROM generate_series(current_date - 89, current_date, '1 day') d
CROSS JOIN LATERAL generate_series(1, (5 + (random()*4)::int + CASE WHEN EXTRACT(DOW FROM d) IN (0,5,6) THEN 4 ELSE 0 END
                                       + ((d::date - (current_date - 89)) / 15))::int) g
CROSS JOIN LATERAL (
  SELECT pr.p_id, pr.p_price FROM products pr JOIN catalog c ON c.name = pr.p_name
  WHERE g.g > 0 ORDER BY -ln(1 - random()) / c.pop LIMIT 1     -- weighted random pick
) p;

-- 4) deliveries: six dated deliveries per product, enough to cover what was sold
--    (three products are deliberately left short so the low-stock alerts have something to show)
INSERT INTO imports (imp_quantity, p_id, unit_cost, "createdAt")
SELECT GREATEST(1, ROUND(t.total * d.share)::int), t.p_id, pr.p_cost, current_date - d.days_ago
FROM (SELECT s.p_id,
             -- normal products end up comfortably above their low-stock level; the three "short" ones do not
             SUM(s.quantity) * 1.05 + CASE WHEN p.p_name IN ('iPhone 16 Pro','MacBook Pro 14"','AirTag') THEN 0 ELSE 3 * p.reorder_level END AS total
      FROM sales s JOIN products p ON p.p_id = s.p_id GROUP BY s.p_id, p.p_name, p.reorder_level) t
JOIN products pr ON pr.p_id = t.p_id
CROSS JOIN (VALUES (0.25, 90), (0.15, 75), (0.15, 60), (0.15, 45), (0.15, 30), (0.15, 14)) d(share, days_ago);
INSERT INTO imports (imp_quantity, p_id, unit_cost, "createdAt")
SELECT 10, p_id, p_cost, current_date - 30 FROM products WHERE p_id NOT IN (SELECT p_id FROM imports);

-- 5) write-offs (damaged / returned-unsellable units), on random days in the last 80 days
INSERT INTO expires (quantity, p_id, "createdAt")
SELECT 1 + (random() < 0.3)::int, p_id, now() - (random()*80 || ' days')::interval
FROM products CROSS JOIN generate_series(1, 2)
WHERE p_name IN ('AirPods 4','AirPods Pro 2','Apple Pencil','AirTag','MagSafe Charger','iPhone 16','Apple Watch SE','iPad (10th gen)');

-- 6) stock on hand = delivered - sold - written off (so every number agrees)
UPDATE stocks st SET s_quantity = GREATEST(0,
      COALESCE((SELECT SUM(imp_quantity) FROM imports WHERE p_id = st.p_id), 0)
    - COALESCE((SELECT SUM(quantity) FROM sales WHERE p_id = st.p_id), 0)
    - COALESCE((SELECT SUM(quantity) FROM expires WHERE p_id = st.p_id), 0)), "updatedAt" = now();
