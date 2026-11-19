# Project Plan: Smart Inventory & Expiration Management System

SWEG 4357/5357 Database Management Systems · Final Group Project · Fall 2026
Team: Gregory Dort, Mohamed Anas Pathan, Tyler Poulin, Lukas Voges

This document records **what we decided, why, and what's left to build**. If you want to change a decision, raise it with the team first, then update this file in the same pull request.

---

## 1. The system in one picture

- **Reads** (lists, dashboards, reports) are `SELECT`s, mostly against **views**.
- **Every stock change** (receive, sell, adjust, dispose) is a **stored procedure call**. The procedure checks the user's role, locks rows, updates stock, and writes the audit log, all in one transaction.

---

## 2. Decisions and why we made them

### 2.1 Database: MySQL installed locally by each person

| Considered                                                  | Chosen            | Why                                                     |
| ----------------------------------------------------------- | ----------------- | ------------------------------------------------------- |
| Docker per person · **local install** · one shared cloud DB | **Local install** | Nothing extra to install or pay for, and works offline. |

Because everyone has their own copy, we use three rules to keep the four databases identical:

1. **Same version:** **MySQL 8.4 LTS**, or anything ≥ 8.0.16. Older versions silently ignore `CHECK` constraints.
2. **The repo is the source of truth.** Every table, view, trigger and procedure lives in a `.sql` file under `db/`. Never change your database only in Workbench; update the file and re-run the reset.
3. **One reset command:** `npm run db:reset` drops the database and rebuilds it from the files listed in [`db/build-order.txt`](../db/build-order.txt).

### 2.2 Data source: Kaggle "Grocery Inventory" CSV

We first looked at an image-recognition dataset (GroceryStoreDataset). It has product photos but **no inventory data**, so we dropped it.

The CSV we use (~990 rows, 17 columns) turned out to be **one row per delivery (batch)**, not one per product. There are only ~95 distinct product names. That suits our design, because tracking separate batches per product is a core requirement.

| CSV column(s)                                                                            | Goes to              | Notes                                                                                  |
| ---------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| `Catagory` (sic)                                                                         | `categories`         | 7 categories                                                                           |
| `Supplier_Name`                                                                          | `suppliers`          | **`Supplier_ID` is ignored:** the same supplier has a different random ID on every row |
| `Product_Name`, `Unit_Price`, `Reorder_Level`                                            | `products`           | one row per distinct name; price and min stock are combined across rows                |
| `Status`, `Reorder_Quantity`                                                             | `product_suppliers`  | they describe a supplier's deal for a product                                          |
| `Product_ID`, `Stock_Quantity`, `Date_Received`, `Expiration_Date`, `Warehouse_Location` | `inventory_batches`  | one batch per CSV row; `Product_ID` becomes the lot number                             |
| `Sales_Volume`                                                                           | `stock_transactions` | generates a RECEIVE + SALE per batch, so the audit log matches stock on hand           |
| `Last_Order_Date`, `Inventory_Turnover_Rate`, `percentage`                               | _dropped_            | meaningless or malformed (e.g. `089%`, `-161%`)                                        |
| _(not in CSV)_                                                                           | `users`              | hand-written demo users in `db/seed/users.sql`                                         |

### 2.3 Import pipeline: CSV → staging table → `INSERT … SELECT`

| Considered                                                                                         | Chosen                          | Why                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOAD DATA LOCAL INFILE` · Node import script · Workbench wizard · **generated SQL + SQL cleanup** | **Generated SQL + SQL cleanup** | `LOAD DATA LOCAL` requires changing a MySQL setting on every machine, and the Workbench wizard can't be repeated reliably. Doing the cleanup in SQL also gives us plenty of SQL to discuss in the report. |

1. `npm run db:csv` converts the CSV into plain `INSERT` statements for a `staging_inventory` table. The generated file is committed, so teammates only ever run `.sql` files.
2. `03_flag_issues.sql` converts the text values (prices like `"$4.60"`, dates like `3/1/2024`) and **flags** problems.
3. `04_normalize.sql` splits staging into the real tables with `INSERT … SELECT`.

### 2.4 Two data-cleaning decisions

**Dates are shifted forward.** All dates in the CSV are from 2024 to early 2025, so today every batch would show as expired. We add **one fixed number of days to every date** so the newest delivery lands about a week before the import date. The gaps between dates stay the same, and the dashboard shows a realistic mix of fresh, expiring-soon and expired stock.

**Dirty rows are flagged but kept as-is.** The data has known problems:

| Issue type                | Example                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| `EXPIRES_BEFORE_RECEIVED` | Coconut Sugar received 5/1/2024, expires 3/30/2024 (common)                   |
| `MISSING_CATEGORY`        | one Cabbage row with a blank category                                         |
| `CATEGORY_MISMATCH`       | Greek Yogurt under "Fruits & Vegetables"; Cauliflower under "Grains & Pulses" |
| `PRICE_OUTLIER`           | Banana at $98.43 / $53.82; Cabbage at $66.55 (typical $1–5)                   |

Each problem becomes a row in an **`import_issues`** table (`batch_id`, `issue_type`, `detail`), shown on the app's _Data issues_ page. Because imported rows break the rule "expiration ≥ received", that rule **can't be a `CHECK` constraint**. Instead, a **`BEFORE INSERT` trigger created after the import** enforces it on new rows only.

### 2.5 Backend data access: raw SQL with `mysql2`

| Considered                                          | Chosen      | Why                                                                                                                                                      |
| --------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Raw SQL** · query builder (Kysely) · ORM (Prisma) | **Raw SQL** | This is a database course: every join, view and transaction should be SQL we wrote and can explain. ORMs hide the SQL and fight our hand-written schema. |

Rules:

- Always use `?` placeholders, **never** string concatenation. This prevents SQL injection.
- Alias columns to camelCase in the SQL (`category_id AS categoryId`).
- SQL lives **only** in `server/src/repositories/`.

### 2.6 Business rules: stored procedures

| Considered                                                                   | Chosen                | Why                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hybrid (constraints + Node transactions) · **stored procedures** · Node only | **Stored procedures** | The rules are enforced _inside the database_, so even someone editing data in Workbench can't skip them. It's also the most database-centred design, which suits the course. |

| Procedure         | Who may call it       | What it does                                                                                                 |
| ----------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `receive_stock`   | Clerk, Manager, Admin | new batch + RECEIVE transaction                                                                              |
| `sell_product`    | Clerk, Manager, Admin | takes stock **first-expired-first-out (FEFO)** across batches, skipping expired ones; one SALE row per batch |
| `adjust_stock`    | Manager, Admin        | correct one batch (reason required); ADJUSTMENT row                                                          |
| `dispose_expired` | Manager, Admin        | zero out expired batches; DISPOSAL rows                                                                      |

Conventions (every procedure follows these; template in [`db/procedures/receive_stock.sql`](../db/procedures/receive_stock.sql)):

- `EXIT HANDLER FOR SQLEXCEPTION → ROLLBACK; RESIGNAL`, plus `START TRANSACTION … COMMIT`.
- Lock rows with `SELECT … FOR UPDATE` before changing them, so two clerks can't sell the last unit twice.
- Errors use `SIGNAL SQLSTATE '45000'`. The API turns the **message prefix** into an HTTP status:

  | Message starts with | HTTP |
  | ------------------- | ---- |
  | `Forbidden:`        | 403  |
  | `Not found:`        | 404  |
  | `Conflict:`         | 409  |
  | anything else       | 400  |

- Constraints stay as a safety net: `CHECK (quantity_on_hand >= 0)`, `CHECK (quantity_change <> 0)` and the foreign keys.
- Reads don't use procedures; they're `SELECT`s and views.

### 2.7 Backend structure: Express REST API in three layers

```
routes/        HTTP only: read the request, call a service, send JSON. No SQL.
services/      business logic; for stock changes, a thin wrapper that calls a procedure.
repositories/  the ONLY place SQL is written.
```

For a complete example of all three layers, see `GET /api/categories`: [route](../server/src/routes/categories.routes.ts) → [service](../server/src/services/categories.service.ts) → [repository](../server/src/repositories/categories.repo.ts).

### 2.8 Frontend: Vite + React + TypeScript, shadcn/ui + Tailwind, Axios

| Topic         | Chosen                                                  | Why                                                                         |
| ------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| Build tool    | Vite                                                    | Create React App is deprecated                                              |
| Routing       | React Router                                            | standard                                                                    |
| Components    | **shadcn/ui + Tailwind**                                | Greg knows Tailwind; ready-made Table, Dialog, Form and Calendar components |
| Data fetching | **Axios only** (TanStack Query considered and declined) | one less library to learn                                                   |

Since we're not using a data-fetching library, **every page loads data the same way**: the [`useApi`](../client/src/hooks/useApi.ts) hook returns `{ data, loading, error, reload }`. After a change like receiving stock, call `reload()` on any data the page shows. API errors carry the procedure's message: use `errorMessage(err)` from `api/http.ts` to display it.

Add shadcn components with `npx shadcn@latest add table dialog form calendar` (run inside `client/`).

### 2.9 Authentication: demo user picker

| Considered                                           | Chosen               | Why                                                  |
| ---------------------------------------------------- | -------------------- | ---------------------------------------------------- |
| Session cookie + bcrypt · JWT · **demo user picker** | **Demo user picker** | fastest to build; the course focuses on the database |

- A dropdown in the header chooses which user you are acting as. Axios sends that user's id as an `X-User-Id` header on every request.
- Roles are enforced **twice**: Express `requireRole(...)` middleware, _and_ inside each procedure through `p_user_id`.
- **Limitation (state this in the report):** there are no passwords, so anyone can pick "Admin". Real login is out of scope. `users.password_hash` (nullable) is reserved so it could be added later without a schema change.

| Action                            | Clerk | Manager | Admin |
| --------------------------------- | :---: | :-----: | :---: |
| View products, stock, reports     |   ✓   |    ✓    |   ✓   |
| Receive stock, record sales       |   ✓   |    ✓    |   ✓   |
| Adjust / dispose stock            |       |    ✓    |   ✓   |
| Add / edit products and suppliers |       |    ✓    |   ✓   |
| Manage users                      |       |         |   ✓   |

### 2.10 Repository and team workflow

- **One repository** with `db/`, `server/` and `client/`. A change that touches the database, API and UI goes in a single pull request.
- **`main` is protected.** Work on short branches (`feat/sell-procedure`, `fix/low-stock-view`) and merge via a GitHub pull request with **1 approval from a teammate**.
- Run `npm run typecheck` (and `npm run db:reset` if you touched `db/`) before opening a PR.
- Never commit `server/.env`.

---

## 3. Folder structure

```
.
├── package.json            npm workspaces + `npm run dev` (starts API + web together)
├── docs/PROJECT_PLAN.md    this file
├── db/
│   ├── build-order.txt     the files `npm run db:reset` runs, in order
│   ├── data/               grocery_inventory.csv (committed)
│   ├── schema/             00 database · 01 tables · 02 views · 03 triggers
│   ├── seed/users.sql      demo users
│   ├── import/             01 staging table · 02 staging data (generated) · 03 flag issues · 04 normalize
│   ├── procedures/         one file per stored procedure
│   └── tests/              CALL-based test scripts
├── server/
│   ├── .env.example        copy to .env with your MySQL password
│   ├── scripts/            db-reset.ts (works) · csv-to-staging.ts (TODO)
│   └── src/
│       ├── index.ts, app.ts
│       ├── config/env.ts
│       ├── db/pool.ts            connection pool + callProcedure()
│       ├── middleware/           errors.ts (procedure error → HTTP) · currentUser.ts (X-User-Id, requireRole)
│       ├── routes/  services/  repositories/
│       └── types/api.ts          JSON response types
└── client/
    └── src/
        ├── api/            http.ts (Axios + X-User-Id) + one file per resource
        ├── hooks/useApi.ts
        ├── context/        CurrentUserContext (demo user picker)
        ├── components/     layout/ (shell, user picker) · ui/ (shadcn)
        ├── pages/          one per screen (stubs with TODO lists)
        └── types.ts        mirror of server/src/types/api.ts
```

**What already works:** the reset runner (it understands `DELIMITER`, so procedure files also run in Workbench), the connection pool, procedure-error → HTTP mapping, role middleware, the user picker, `useApi`, the app layout, and one complete example (`GET /api/categories` shown on the Dashboard). **Everything else is a stub** with a TODO list naming its owner.

---

## 4. Getting started (each teammate)

Database setup and SQL-writing conventions are covered step by step in **[DATABASE_GUIDE.md](DATABASE_GUIDE.md)**. Short version:

1. Install **Node.js 22+** and **MySQL 8.4 LTS**. Remember your MySQL root password.
2. Clone the repo, then run `npm install` from the repo root.
3. `cp server/.env.example server/.env` and set `DB_PASSWORD`.
4. `npm run db:reset` builds the database. Missing files are skipped with a warning while the TODOs aren't done yet.
5. `npm run dev` starts the API on http://localhost:3001/api and the app on **http://localhost:5173**.

---

## 5. Work split

| Who            | Owns                                                              | Main files                                        |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| **Greg**       | Express API + React/Tailwind frontend                             | `server/src/**`, `client/src/**`                  |
| **Teammate A** | Schema: tables, constraints, views, trigger, demo users           | `db/schema/*`, `db/seed/users.sql`                |
| **Teammate B** | Import: CSV conversion, date shift, issue flagging, normalization | `server/scripts/csv-to-staging.ts`, `db/import/*` |
| **Teammate C** | Stored procedures and their tests                                 | `db/procedures/*`, `db/tests/*`                   |

_(Fill in names for A, B and C.)_ Everyone contributes to the report and presentation.

**Avoiding blockers:**

- Everyone depends on the schema, so Teammate A merges `01_tables.sql` first.
- **Procedure signatures and view columns are the API contract.** Agree on them in week 1 (section 6, phase 1), so Greg can code against them before they're implemented.
- Until the API is ready, the frontend can have `useApi` return hard-coded sample data.
- Someone other than Greg should review the API and UI pull requests, so more than one person understands that code.

---

## 6. What needs to be done

### Phase 1: Contract (week 1, everyone)

- [ ] Put the CSV in the repo as `db/data/grocery_inventory.csv`
- [ ] Agree on table columns and types (draft in `db/schema/01_tables.sql` comments)
- [ ] Agree on view names and columns (`v_product_stock`, `v_expiring_batches`, `v_dashboard_summary`)
- [ ] Agree on procedure parameters and error messages (headers in `db/procedures/*.sql`)
- [ ] Agree on the API endpoint list (section 7)
- [ ] Decide the rules for combining per-row `Unit_Price` / `Reorder_Level` into one product value, and the outlier threshold
- [ ] Protect `main` on GitHub (require 1 approval)

### Phase 2: Database (Teammates A, B, C)

- [ ] **A:** `01_tables.sql` with PKs, FKs, `CHECK`s, `UNIQUE`s and indexes on FK and filter columns
- [ ] **A:** `seed/users.sql` (Admin, Managers, Clerks, one inactive user, `system_import`)
- [ ] **A:** `02_views.sql`
- [ ] **A:** `03_triggers.sql` (expiration ≥ received, for new rows)
- [ ] **B:** `csv-to-staging.ts` → commit the generated `02_staging_data.sql`
- [ ] **B:** `01_staging_table.sql`
- [ ] **B:** `03_flag_issues.sql` (type conversion, date shift, issue detection)
- [ ] **B:** `04_normalize.sql` (categories → suppliers → products → product_suppliers → batches → transactions → import_issues)
- [ ] **B:** after import, verify every batch's `quantity_on_hand = SUM(quantity_change)`
- [ ] **C:** `receive_stock`, `sell_product` (FEFO), `adjust_stock`, `dispose_expired`
- [ ] **C:** `db/tests/test_procedures.sql`: happy path, wrong role, insufficient stock (prove the rollback worked), invalid ids

### Phase 3: API (Greg)

- [ ] Response types in `server/src/types/api.ts` (and mirror them in `client/src/types.ts`)
- [ ] Products: list (search / category / low stock / pagination), detail with batches + suppliers, create/edit
- [ ] Inventory: receive / sell / adjust / dispose → `callProcedure`
- [ ] Suppliers, transactions (audit log), reports (dashboard, expiring, low stock, import issues)
- [ ] Input checks on request bodies (e.g. quantity is a positive integer) before calling procedures

### Phase 4: Frontend (Greg)

- [ ] Tailwind design tokens + shadcn components (`table`, `dialog`, `form`, `calendar`, `badge`, `card`)
- [ ] Dashboard: stat cards, expiring soon, low stock, "dispose expired"
- [ ] Products list + product detail (batches, suppliers, receive / sell / adjust actions)
- [ ] Inventory, Suppliers, Transactions, Data issues pages
- [ ] Hide or disable actions the picked user's role can't perform; show procedure error messages

### Phase 5: Report and demo (everyone)

- [ ] ER diagram and relational schema (with normalization discussion: why `product_suppliers` exists, why one CSV row becomes one batch)
- [ ] Cleaning rules and `import_issues` statistics (before/after counts)
- [ ] Stored procedures: FEFO logic, locking, transactions; show a test proving rollback works
- [ ] Sample queries: joins, aggregates and views behind each report
- [ ] Limitations: demo user picker (no passwords), shifted dates, flagged dirty data
- [ ] Demo script: pick a Clerk → sell → low-stock alert appears → switch to a Manager → dispose expired → show the audit log

---

## 7. Proposed API contract (to finalize in phase 1)

| Method       | Path                                                | Role           | Backed by                                                     |
| ------------ | --------------------------------------------------- | -------------- | ------------------------------------------------------------- |
| GET          | `/api/health`                                       | —              | —                                                             |
| GET          | `/api/users` · `/api/users/me`                      | —              | `users`                                                       |
| GET          | `/api/categories`                                   | any            | `categories` ✅ built                                         |
| GET          | `/api/products?search=&categoryId=&lowStock=&page=` | any            | `v_product_stock`                                             |
| GET          | `/api/products/:id`                                 | any            | `v_product_stock` + `inventory_batches` + `product_suppliers` |
| POST / PATCH | `/api/products` · `/api/products/:id`               | Manager, Admin | `products`                                                    |
| GET          | `/api/suppliers` · `/api/suppliers/:id`             | any            | `suppliers`, `product_suppliers`                              |
| POST / PATCH | `/api/suppliers` · `/api/suppliers/:id`             | Manager, Admin | `suppliers`                                                   |
| POST         | `/api/inventory/receive`                            | Clerk+         | `CALL receive_stock`                                          |
| POST         | `/api/inventory/sell`                               | Clerk+         | `CALL sell_product`                                           |
| POST         | `/api/inventory/adjust`                             | Manager, Admin | `CALL adjust_stock`                                           |
| POST         | `/api/inventory/dispose-expired`                    | Manager, Admin | `CALL dispose_expired`                                        |
| GET          | `/api/transactions?productId=&type=&page=`          | any            | `stock_transactions` joins                                    |
| GET          | `/api/reports/dashboard`                            | any            | `v_dashboard_summary`                                         |
| GET          | `/api/reports/expiring?days=7`                      | any            | `v_expiring_batches`                                          |
| GET          | `/api/reports/low-stock`                            | any            | `v_product_stock`                                             |
| GET          | `/api/reports/import-issues`                        | any            | `import_issues`                                               |

Errors always look like `{ "error": "message" }`.

---

## 8. Open questions

- Exact rule for a product's `min_stock_level`: average, maximum, or median of the CSV `Reorder_Level` values? Stock is summed across batches, so this decides how often low-stock alerts fire.
- The outlier threshold for `PRICE_OUTLIER`.
- Should `dispose_expired` also be callable per batch?
- Does anyone on the team use Windows? The setup should work there too, but check the MySQL install early.
