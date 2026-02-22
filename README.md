# StockSystem — Inventory & Sales Management Application

A full-stack web application for managing product inventory, tracking sales, monitoring stock levels, and analyzing business performance. Built with a React/TypeScript frontend and a Node.js/Express backend connected to a PostgreSQL database.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Usage Guide](#usage-guide)
- [Screenshots / UI Sections](#ui-sections)

---

## Overview

StockSystem is a business inventory management platform that allows store operators to:

- Track product stock levels in real time
- Record and monitor sales transactions
- Manage product imports and expired goods
- View sales performance with charts and analytics
- Perform full CRUD operations on products via a dashboard UI

The system is divided into two parts:
- **`backend/`** — REST API server powered by Node.js, Express, Sequelize ORM, and PostgreSQL
- **`my-ts-app/`** — Single Page Application (SPA) built with React, TypeScript, Vite, and Tailwind CSS

---

## Features

| Feature | Description |
|---|---|
| User Authentication | JWT-based login system with secure token management |
| Product Management | Create, read, update, and delete products |
| Stock Tracking | Real-time stock levels per product |
| Sales Recording | Submit sales transactions that deduct from stock |
| Import Tracking | Log product imports to increase stock |
| Expiry Management | Track expired products and deduct from inventory |
| Overview Dashboard | KPIs, low-stock alerts, and total sales summary |
| Sales Performance | Bar charts showing top-selling products |
| Inventory Analysis | Comprehensive stock reports including imports and expirations |
| Product Analysis | Search, filter, and manage products from the dashboard |

---

## Tech Stack

### Frontend (`my-ts-app/`)

| Technology | Version | Purpose |
|---|---|---|
| React | 19.1.0 | UI framework |
| TypeScript | 5.8.3 | Type-safe JavaScript |
| Vite | 7.0.3 | Build tool and dev server |
| Tailwind CSS | 4.1.11 | Utility-first styling |
| shadcn/ui | — | Pre-built accessible components |
| Material-UI (MUI) | — | Charts (`LineChart`, `BarChart`) |
| React Router DOM | 7.6.3 | Client-side routing |
| TanStack React Query | — | Server state and data fetching |
| Axios | — | HTTP client for API calls |
| Lucide React | — | Icon library |

### Backend (`backend/`)

| Technology | Version | Purpose |
|---|---|---|
| Node.js | — | JavaScript runtime |
| Express | 5.1.0 | Web framework |
| Sequelize | 6.37.7 | ORM for PostgreSQL |
| PostgreSQL (pg) | 8.16.3 | Relational database |
| JSON Web Token | — | Authentication tokens |
| bcryptjs | — | Password hashing utility |
| dotenv | — | Environment variable management |
| CORS | — | Cross-origin resource sharing |
| nodemon | — | Auto-reload during development |

---

## Project Structure

```
StockSystem/
├── README.md
│
├── backend/                         # Express REST API
│   ├── server.js                    # App entry point, server startup
│   ├── package.json
│   ├── controller/
│   │   ├── authController.js        # Login & JWT token generation
│   │   └── productPost.js           # Product, sales, inventory controllers
│   ├── middleware/
│   │   └── authen.js                # JWT authentication middleware
│   ├── model/                       # Sequelize models (database tables)
│   │   ├── product.js               # Products table
│   │   ├── stock.js                 # Stock table
│   │   ├── sale.js                  # Sales table
│   │   ├── importProduct.js         # Product imports table
│   │   ├── expireProduct.js         # Expired products table
│   │   └── relational/
│   │       └── relation.js          # ORM associations (FK relationships)
│   ├── respositories/
│   │   └── psqlProduct.js           # All database queries (data access layer)
│   ├── routes/
│   │   └── post.js                  # All API route definitions
│   └── ulits/
│       ├── database.js              # Sequelize connection configuration
│       └── db.js                    # Secondary DB utility
│
└── my-ts-app/                       # React TypeScript frontend
    ├── index.html                   # HTML entry template
    ├── vite.config.ts               # Vite configuration
    ├── tsconfig.json                # TypeScript config
    ├── components.json              # shadcn/ui configuration
    ├── package.json
    └── src/
        ├── main.tsx                 # React DOM root entry point
        ├── App.tsx                  # App-level routing
        ├── App.css
        ├── index.css                # Global styles (Tailwind directives)
        ├── components/
        │   ├── Dashboard.tsx        # Main dashboard layout and login gate
        │   ├── ui/                  # shadcn/ui base components
        │   │   ├── button.tsx
        │   │   ├── card.tsx
        │   │   ├── dialog.tsx
        │   │   ├── input.tsx
        │   │   ├── label.tsx
        │   │   ├── select.tsx
        │   │   ├── tabs.tsx
        │   │   ├── table.tsx
        │   │   ├── toast.tsx
        │   │   ├── tooltip.tsx
        │   │   └── badge.tsx
        │   └── dashboard/           # Feature-specific dashboard sections
        │       ├── Overview.tsx         # KPI metrics and analytics
        │       ├── SalesPerformance.tsx # Sales charts and top sellers
        │       ├── InventoryManagement.tsx # Stock, imports, expiry tracking
        │       ├── ProductsAnalysis.tsx # Product CRUD management
        │       ├── salePage.tsx         # Sale transaction form
        │       └── Sidebar.tsx          # Navigation sidebar
        ├── pages/
        │   ├── Index.tsx            # Root page (renders Dashboard)
        │   └── NotFound.tsx         # 404 page
        ├── services/                # Axios API service modules
        │   ├── loginService.tsx     # Authentication API calls
        │   ├── productService.tsx   # Products API calls
        │   ├── salesService.tsx     # Sales API calls
        │   └── inventoryService.tsx # Inventory API calls
        ├── hooks/
        │   ├── use-mobile.tsx       # Responsive mobile detection hook
        │   └── use-toast.ts         # Toast notification hook
        └── lib/
            └── utils.ts             # cn() class name utility
```

---

## Database Schema

The application uses PostgreSQL with Sequelize managing five tables:

### `products`
| Column | Type | Description |
|---|---|---|
| `p_id` | INT (PK, AUTO) | Product ID |
| `p_name` | VARCHAR | Product name |
| `p_price` | FLOAT | Product price |

### `stock`
| Column | Type | Description |
|---|---|---|
| `s_id` | INT (PK, AUTO) | Stock record ID |
| `p_id` | INT (FK) | References `products.p_id` |
| `s_quantity` | INT | Current quantity in stock |

### `sale`
| Column | Type | Description |
|---|---|---|
| `sale_id` | INT (PK, AUTO) | Sale ID |
| `p_id` | INT (FK) | References `products.p_id` |
| `quantity` | INT | Quantity sold |
| `createdAt` | TIMESTAMP | Auto-managed by Sequelize |
| `updatedAt` | TIMESTAMP | Auto-managed by Sequelize |

### `imports`
| Column | Type | Description |
|---|---|---|
| `imp_id` | INT (PK, AUTO) | Import ID |
| `p_id` | INT (FK) | References `products.p_id` |
| `imp_quantity` | INT | Quantity imported |

### `expires`
| Column | Type | Description |
|---|---|---|
| `exp_id` | INT (PK, AUTO) | Expiry record ID |
| `p_id` | INT (FK) | References `products.p_id` |
| `quantity` | INT | Quantity marked as expired |

### `userschema`
| Column | Description |
|---|---|
| `id` | User ID |
| `username` | Login username |
| `password` | Stored password |

### Relationships
- `products` → `stock` : One-to-One (CASCADE delete)
- `products` → `sale` : One-to-Many (CASCADE delete)
- `products` → `imports` : One-to-Many (CASCADE delete)
- `products` → `expires` : One-to-Many (CASCADE delete)

---

## API Reference

**Base URL:** `http://localhost:4000/api`

### Authentication

| Method | Endpoint | Description | Body |
|---|---|---|---|
| `POST` | `/login` | Login and receive JWT token | `{ username, password }` |

**Response:**
```json
{
  "token": "<jwt_token>"
}
```

---

### Products

| Method | Endpoint | Description | Body / Params |
|---|---|---|---|
| `GET` | `/products` | Get all products with stock levels | — |
| `POST` | `/products` | Create a new product | `{ p_name, p_price }` |
| `PUT` | `/products/:id` | Update product price | `{ p_price }` |
| `DELETE` | `/products/:id` | Delete a product | — |
| `GET` | `/products/name/:name` | Find product by name | URL param: `name` |

---

### Sales

| Method | Endpoint | Description | Body |
|---|---|---|---|
| `POST` | `/products/sale` | Record a sale (deducts from stock) | `{ p_name, quantity }` |
| `GET` | `/products/sales` | Get all sales aggregated by product | — |

---

### Inventory

| Method | Endpoint | Description | Body |
|---|---|---|---|
| `GET` | `/products/inventory-summary` | Get full inventory report (stock, imports, expiry) | — |
| `POST` | `/products/expire` | Mark quantity of a product as expired | `{ p_name, quantity }` |
| `GET` | `/products/expired` | Get list of all expired product records | — |

---

## Getting Started

### Prerequisites

Ensure the following are installed on your machine:

- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) v13 or higher
- npm or yarn

---

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd StockSystem/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the `backend/` directory:
   ```env
   DB_NAME=your_database_name
   DB_USER=your_postgres_username
   DB_HOST=localhost
   DB_PASSWORD=your_postgres_password
   JWT_SECRET=your_jwt_secret_key
   PORT= PORT
   ```

4. **Create the PostgreSQL database:**
   ```sql
   CREATE DATABASE your_database_name;
   ```

5. **Start the backend server:**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:{PORT}`.
   Sequelize will automatically sync and create all required tables on startup.

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd StockSystem/my-ts-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

4. **Build for production:**
   ```bash
   npm run build
   ```
   Output will be in `my-ts-app/dist/`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DB_NAME` | PostgreSQL database name | `stockdb` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_HOST` | PostgreSQL host address | `localhost` |
| `DB_PASSWORD` | PostgreSQL password | `yourpassword` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `mysecretkey` |
| `PORT` | Port for the Express server | `4000` |

> The frontend API base URL is currently hardcoded as `http://localhost:4000/api` in the service files.

---

## Usage Guide

### 1. Login
On first load, the application presents a login form. Enter valid credentials stored in the `userschema` table to receive a JWT token and access the dashboard.

### 2. Overview (Dashboard Home)
- View total sales count, total products, and total stock
- See low-stock alerts for products running out
- Review sales trend data via charts

### 3. Sales Performance
- View a bar chart of top-selling products
- Browse a full sales table with product name and total quantity sold

### 4. Inventory Management
- Monitor current stock levels per product
- View import history and quantities
- Track expired product records
- Submit new expired product entries via form

### 5. Product Analysis (CRUD)
- Search products by name
- Add new products (name + price)
- Update existing product prices
- Delete products (cascades to all related records)

### 6. Record a Sale
- Navigate to the "Sale" section
- Enter product name and quantity
- Submit to deduct from stock and record the transaction

---

## UI Sections

| Section | Description |
|---|---|
| **Overview** | Business KPIs, low-stock alerts, price trend charts |
| **Sales Performance** | Bar chart per product, ranked sales table |
| **Inventory Management** | Stock per product, import log, expiry log |
| **Product Analysis** | Full product CRUD with search and price editing |
| **Sale** | Quick sale transaction form |

---

## Notes

- The backend uses Sequelize `sync({ alter: true })` on startup, which auto-creates or modifies tables to match models.
- All foreign key relationships use `CASCADE` delete, so removing a product will remove all related stock, sales, import, and expiry records.
- The frontend communicates with the backend using Axios with the JWT token attached in the `Authorization` header after login.
- There is currently no `.env` file for the frontend; the backend API URL is defined directly in the service files under `src/services/`.
