# StockSystem

A stock and sales tracking system with a business dashboard. Record sales, manage products and stock, and see
how the business is doing: sales and profit over time, best sellers, busiest hours, what is running low, and where
money is tied up.

The demo data is an Apple reseller (iPhone, iPad, Mac, Apple Watch, Accessories), so the charts have something real to show.

| | |
|---|---|
| **Backend** | Node.js, Express 5, Sequelize, PostgreSQL |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, MUI X Charts, shadcn/ui |
| **Tested with** | 32 end-to-end API tests, 36 frontend unit tests |

---

## What you can do

| Page | What it is for |
|---|---|
| **Overview** | The big picture for any date range: sales, profit, items sold, inventory value and write-offs (with a small trend line on each). Sales over time compared with the period before, profit margin, a health check (profit margin, stock level, write-off rate), sales and profit by product type, the last 12 months, where the money goes (sales to profit), best sellers, busiest days, and products running low. |
| **Sales Performance** | Your top 10 products with the dollar amount on each bar, quick facts in plain words, a weekday-by-hour heatmap of when customers buy, which products earn well (sales vs profit per sale), what types are selling over time, and a table of every product. |
| **Inventory** | Is there enough stock (stock next to each product's reorder level), how long it will last at the current pace, stock coming in and going out each week, money sitting in stock by type, write-off losses, and a table of every product with a **write off** button. |
| **Products** | Add, edit and delete products (price, cost, type, low-stock level, opening stock). Search, filter by type, see profit margin. **Import many products from a CSV file.** |
| **New Sale** | Click **Add** on any product to build a sale, adjust quantities, and complete it in one step. Filter by type or search. **Import many sales from a CSV file.** |

Every dashboard page can be filtered by **date range** (quick buttons, year/month dropdowns, or calendars), **type** (iPhone, Mac, ...)
and **product**. The filters stay the same when you move between pages.

---

## Getting started

### You need
- Node.js 20 or newer
- PostgreSQL 14 or newer, running locally, and an empty database for the app (for example `stocks`)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then open .env and fill in your database details and a JWT_SECRET
npm run dev                 # API on http://localhost:4000  (use `npm start` for a plain run without auto-reload)
```

On first start the server creates or upgrades all tables by itself.

Create the first login user (a password of at least 6 characters; it is stored as a hash):

```bash
npm run create-user -- admin your-password
```

### 2. Demo data (optional)

```bash
psql -U postgres -d stocks -f backend/sampleData.sql
```

This loads 25 Apple products, 90 days of sales, deliveries, write-offs and consistent stock levels.
**It replaces all products, categories, stock, deliveries, write-offs and sales in that database** (it leaves the login table alone), so only use it on a database you are happy to overwrite.

### 3. Frontend

```bash
cd my-ts-app
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173 and sign in with the user you created. If the API is not on `http://localhost:4000`,
copy `my-ts-app/.env.example` to `.env` and set `VITE_API_URL`.

---

## Importing from CSV

Both import buttons show a **preview** and flag every problem row before anything is saved. If any row is wrong, nothing is imported.
Each page has a **Sample CSV** link; the files live in `my-ts-app/public/samples/`.

| Where | Columns | Notes |
|---|---|---|
| **New Sale** > Import CSV | `product, quantity, date` | `date` is optional (`YYYY-MM-DD`, blank = today, never in the future). Products must already exist. Stock is reduced, and a past date back-dates the sale. |
| **Products** > Import CSV | `name, type, price, cost, stock, reorder_level` | A name that already exists is **updated**, and its `stock` is **added** as a delivery. A blank `cost` or `reorder_level` keeps the current value. A new `type` creates a new type. |

- Up to 2,000 rows per file and 1 MB.
- Money can be written like `1299`, `1,299.50` or `$1,299`.
- Comma or semicolon separated, with or without quotes. A name containing an inch mark is written `"MacBook Air 13"""`, which spreadsheet programs do for you.

---

## Database

PostgreSQL, managed by Sequelize. Tables are created and upgraded automatically when the server starts
(`backend/db/migrate.js` keeps data safe when upgrading an older database, for example moving free-text categories into a table).

| Table | Purpose | Main columns |
|---|---|---|
| `categories` | Product types (iPhone, Mac, ...) | `category_id`, `name` (unique) |
| `products` | The catalogue | `p_id`, `p_name` (unique ignoring capitals), `p_price`, `p_cost`, `category_id`, `sku` (unique), `reorder_level`, `is_active`, `createdAt` |
| `stocks` | Current stock per product | `p_id`, `s_quantity` (never below 0) |
| `sales` | One row per product sold | `p_id`, `quantity` (above 0), `unit_price` (the price **at the time of sale**), `createdAt` |
| `imports` | Deliveries | `p_id`, `imp_quantity`, `unit_cost`, `createdAt` |
| `expires` | Write-offs (damaged, expired, unsellable) | `p_id`, `quantity`, `createdAt` |
| `userschema` | Logins | `id`, `username`, `password` (bcrypt hash) |

**Rules the database enforces by itself**

- No negative prices, costs or stock; no zero or negative quantities.
- A product that has sales can never be deleted, so past revenue and profit stay correct. The app **hides** it instead (`is_active = false`).
- Selling checks stock, deducts it and records the sale in one locked step, so two sales at the same moment can never oversell. Twelve simultaneous sales of a product with 5 in stock let exactly 5 through.
- Because each sale keeps its own `unit_price`, changing a product's price later does not rewrite history.

---

## API

Base URL `http://localhost:4000/api`. JSON in and out. Everything except login and health needs `Authorization: Bearer <token>`.

| Group | Endpoint | What it does |
|---|---|---|
| Public | `POST /login` | `{ username, password }` returns `{ token, user }` (valid 8 hours) |
| | `GET /health` | Is the server up |
| Products | `GET /products` | Active products with stock and type |
| | `POST /products` | Create a product, or add stock if the name already exists |
| | `PUT /products/:id` | Update price, cost, type, name, SKU, low-stock level |
| | `DELETE /products/:id` | Delete, or hide if it has sales |
| | `GET /products/name/:name` | Look up one product by name |
| | `POST /products/import` | Bulk add/update (CSV import), all or nothing |
| Types | `GET /categories`, `POST /categories` | List / create a type |
| Selling | `POST /products/sale` | One product, `{ p_name, quantity }` |
| | `POST /sales/batch` | Many lines at once (cart checkout and CSV import), all or nothing |
| Stock | `POST /products/expire` | Write off all remaining stock of a product |
| | `GET /products/expired`, `/products/sales`, `/products/inventory-summary` | Simple lists and totals |
| Dashboard | `GET /analytics/overview` | Every number on the Overview and Sales pages. Query: `from`, `to` (`YYYY-MM-DD`), `product_id`, `category_id` |
| | `GET /analytics/inventory` | Days of stock left, weekly stock flow, write-off losses, stock value by type |

Errors always come back as JSON with a plain message, for example `400 { "message": "Price must be a number of 0 or more." }`.

---

## Security and error handling

- **Login required** for all data. A missing or expired token returns you to the sign-in page with a short message.
- **Passwords are hashed** (bcrypt). The login answer never says whether the username or the password was wrong.
- **Strict input checks** on every endpoint (prices, quantities, ids, dates, text length). Bad input gets a clear 400, never a server error.
- **The server will not start without `JWT_SECRET`.** No secrets are kept in the code; settings live in `backend/.env`, which git ignores.
- If the server is down, each page shows "Cannot reach the server" with a **Try again** button.

---

## Configuration

`backend/.env` (see `backend/.env.example`)

| Variable | Meaning |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | PostgreSQL connection |
| `JWT_SECRET` | Required. Any long random text |
| `PORT` | API port (default 4000) |
| `BUSINESS_TZ` | Time zone for the weekday/hour charts, for example `Asia/Phnom_Penh` (default UTC) |

`my-ts-app/.env` (optional): `VITE_API_URL`, the API address (default `http://localhost:4000/api`).

---

## Tests

```bash
# Backend: start the API first (npm start), then in a second terminal:
cd backend && npm test        # 32 end-to-end tests against the real database; it cleans up after itself

# Frontend
cd my-ts-app && npm test      # 36 unit tests: CSV reader, number parsing, date-filter logic
```

The API tests cover login and tokens, input checks, duplicate and hidden products, stock never going negative (including under 12 simultaneous sales),
all-or-nothing batch and CSV imports, the database's own rules, and that every dashboard number adds up to the same total and matches the database.

---

## Project structure

```
StockSystem/
├── backend/
│   ├── server.js               start-up: connect, upgrade the database, routes, JSON errors
│   ├── routes/post.js          all routes; everything after login is protected
│   ├── controller/             request checks and answers (auth, products, dashboard, bulk)
│   ├── respositories/          all database work (queries, transactions, dashboard SQL)
│   ├── model/                  Sequelize tables and how they connect
│   ├── middleware/authen.js    token check
│   ├── ulits/                  database connection, input validators
│   ├── db/                     migrate.js (safe upgrades), createUser.js
│   ├── sampleData.sql          demo data (Apple reseller)
│   └── test/api.test.js        end-to-end tests
└── my-ts-app/
    ├── public/samples/         sample CSV files
    └── src/
        ├── components/Dashboard.tsx        login screen and app shell
        ├── components/dashboard/           the five pages, charts, filter bar, calendar, CSV importer
        ├── hooks/                          shared filters, dashboard data loading
        ├── services/                       API calls
        └── lib/                            session/token, CSV reader, date-filter logic, formatting (+ tests)
```

---

## Good to know

- **Dates and time zones.** Dates are in UTC unless you set `BUSINESS_TZ`; that only affects the weekday and hour charts. A sale made late in the evening in a time zone ahead of UTC can fall on the next day in the daily totals.
- **Write-offs** remove *all* remaining stock of a product in one step, and cannot be undone.
- **Demo data replaces data.** Do not run `sampleData.sql` on a database with real records.
- Older versions of this project stored passwords as plain text and had the database password in the source code. If you ever used that version, change the database password.
