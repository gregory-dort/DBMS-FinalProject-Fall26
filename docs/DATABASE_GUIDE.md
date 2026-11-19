# Database Guide: setting up MySQL and writing SQL files

This guide makes sure all four of us have **the same database** and write SQL **the same way**.
For why things are designed this way, see [PROJECT_PLAN.md](PROJECT_PLAN.md).

**The one rule:** the `.sql` files in `db/` are the database. Your local MySQL is just a copy built from them.
If something isn't in a file in the repo, it doesn't exist for the rest of the team, and the next reset deletes it.

---

## Part 1: One-time setup

### 1. Install the tools

| Tool | Version | Why |
| --- | --- | --- |
| **MySQL Server** | **8.4 LTS** (anything ≥ 8.0.16 works) | the database. Older versions ignore `CHECK` constraints |
| **MySQL Workbench** | latest 8.0.x | writing and testing SQL |
| **Node.js** | **22 or newer** | runs `npm run db:reset`, which rebuilds the database |
| **Git** | any | getting the repo |

Download MySQL Server and Workbench from **dev.mysql.com/downloads**.
- **Mac:** use the DMG installer, or Homebrew (`brew install mysql@8.4`, then `brew services start mysql@8.4`).
- **Windows:** run the MySQL Server MSI installer, then install Workbench separately.

During install you'll set a **root password. Write it down**: you'll need it in step 3.

> Workbench may warn that the server version is "not fully supported" when you connect to 8.4. That warning is harmless; click *Continue Anyway*.

### 2. Get the code

```bash
git clone <our repo URL>
cd DBMS-FinalProject-Fall26
npm install
```

### 3. Tell the project your MySQL password

```bash
cp server/.env.example server/.env        # Windows (PowerShell): copy server\.env.example server\.env
```

Open `server/.env` and set `DB_PASSWORD=` to your root password. Leave everything else as is.
**Never commit `.env`.** It's already git-ignored.

### 4. Build the database

```bash
npm run db:reset
```

You should see an `ok` line per file, ending in `Done.` Files that don't exist yet are listed as `skip`; that's expected early on.

### 5. Connect Workbench

Create a connection: host `127.0.0.1`, port `3306`, user `root`, and your password.
You should now see a `grocery_inventory` schema in the left sidebar. Click the refresh icon if it doesn't appear.

---

## Part 2: The everyday workflow

### Keep your database in sync with the team

**Every time you `git pull` and something in `db/` changed, run `npm run db:reset`.**
A reset wipes and rebuilds the whole database, so it takes about 10 seconds and always leaves you matching `main`.
Any test data you typed in by hand is lost, which is fine. Real data comes from the import files.

### Writing or changing SQL

1. **Create a branch:** `git checkout -b feat/sell-procedure`
2. **Open the repo file in Workbench:** *File → Open SQL Script…* → e.g. `db/procedures/sell_product.sql`.
   Edit *that* file. Don't paste the SQL into a new, unsaved tab.
3. **Run it** with the ⚡ (execute all) button. This creates or replaces the object in your local database.
4. **Test it** in a separate tab (see Part 5).
5. **Save the file** (⌘S / Ctrl+S).
6. **Prove it builds from scratch:** `npm run db:reset` must finish with `Done.`
7. **Commit and open a pull request:**
   ```bash
   git add db/
   git commit -m "Add sell_product procedure (FEFO)"
   git push -u origin feat/sell-procedure
   ```
   Then open a PR on GitHub and ask a teammate to review.

### Adding a brand-new SQL file

The reset only runs files listed in **[`db/build-order.txt`](../db/build-order.txt)**, top to bottom.
Add your file there **in the right place**: a table must be created before anything that references it.
Order: database → tables → views → seed users → import → triggers → procedures.

### No Node? Build manually in Workbench

If `npm run db:reset` won't run on your machine, you can open each file listed in `db/build-order.txt` in Workbench and execute them **in that order**.
This gives the same result. Do fix your Node setup soon, though, because it's much faster.

---

## Part 3: SQL file conventions

### Every file starts like this

```sql
-- OWNER: <your name>
-- <One line: what this file creates.>
-- Depends on: <tables/views it needs, if any>

USE grocery_inventory;
```

`USE grocery_inventory;` matters: without it, Workbench runs your SQL in whichever schema happens to be selected.

### Make files safe to run twice (procedures, triggers, views)

You'll run a file many times in Workbench while developing it, so drop the old version first:

```sql
DROP PROCEDURE IF EXISTS sell_product;
DROP TRIGGER   IF EXISTS trg_batches_check_expiration;
CREATE OR REPLACE VIEW v_product_stock AS ...;
```

Tables don't need this, because the reset drops the whole database first.
To re-run `01_tables.sql` in Workbench, run `00_database.sql` before it.

### Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Tables | `snake_case`, plural | `inventory_batches` |
| Columns | `snake_case` | `quantity_on_hand` |
| Primary key | `<singular>_id` | `batch_id` |
| Foreign key column | same name as the column it references | `product_id` |
| Constraints | `pk_` / `fk_<table>_<ref>` / `uq_` / `chk_` / `ix_` | `fk_batches_product`, `chk_batches_qty` |
| Views | `v_` + noun | `v_expiring_batches` |
| Triggers | `trg_<table>_<what>` | `trg_batches_check_expiration` |
| Procedures | `verb_noun` | `receive_stock` |
| Procedure parameters | `p_` prefix | `p_user_id` |
| Procedure local variables | `l_` prefix | `l_available` |
| SQL keywords | UPPERCASE | `SELECT`, `JOIN`, `WHERE` |

Prefixes stop a parameter like `p_product_id` from being confused with the column `product_id`. Without them, MySQL silently uses the parameter in places where you meant the column.

### Data types

| Kind of value | Type |
| --- | --- |
| Money | `DECIMAL(10,2)`. **Never** `FLOAT`/`DOUBLE`, which have rounding errors |
| Quantities, counts | `INT` (`UNSIGNED` where negatives make no sense) |
| Calendar dates (received, expiration) | `DATE` |
| Moments in time (transaction time) | `DATETIME DEFAULT CURRENT_TIMESTAMP` |
| Yes/no | `BOOLEAN` (stored as 0/1) |
| Fixed list of values | `ENUM('CLERK','MANAGER','ADMIN')` |
| Text | `VARCHAR(n)` with a sensible `n` |

Name every constraint explicitly: `CONSTRAINT chk_batches_qty CHECK (quantity_on_hand >= 0)`. Error messages then say *which* rule failed.

### Stored procedures and triggers

Use the template at the top of [`db/procedures/receive_stock.sql`](../db/procedures/receive_stock.sql). In short:

```sql
USE grocery_inventory;

DROP PROCEDURE IF EXISTS sell_product;

DELIMITER $$
CREATE PROCEDURE sell_product(IN p_user_id INT, IN p_product_id INT, IN p_quantity INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;            -- pass the original error on to the caller
  END;

  -- 1. role check → SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Forbidden: ...';
  START TRANSACTION;
  -- 2. validate + lock rows with SELECT ... FOR UPDATE
  -- 3. UPDATE stock + INSERT INTO stock_transactions
  COMMIT;
END$$
DELIMITER ;
```

- **`DELIMITER $$` / `DELIMITER ;`** lets the procedure body contain `;`. It works in Workbench *and* in our reset script.
- **Error messages must start with a prefix**, because the API turns it into an HTTP status:
  `Forbidden:` (403) · `Not found:` (404) · `Conflict:` (409) · anything else (400).
  Example: `SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conflict: Insufficient stock: requested 10, available 4';`
- **Never include `DEFINER=`.** Workbench's GUI editors write `` CREATE DEFINER=`root`@`localhost` PROCEDURE ``. Delete the `DEFINER=…` part: it ties the procedure to *your* account and can break on a teammate's machine.

### Things that must not happen

- ❌ Creating or altering tables with Workbench's GUI (*Alter Table…*, *Create Table…*, editing in the result grid) **without copying the generated SQL into the repo file**.
- ❌ Saving SQL in a file outside `db/`, or only in an unsaved Workbench tab.
- ❌ Editing `db/import/02_staging_data.sql` by hand. It's generated by `npm run db:csv`.
- ❌ Committing `server/.env` or anything in `kaggle-data/`.

---

## Part 4: Workbench settings

- **Safe updates:** by default Workbench blocks `UPDATE`/`DELETE` statements that don't filter on a key column (**Error 1175**). To test procedures like `dispose_expired`, turn this off under *Preferences → SQL Editor → "Safe Updates"* and reconnect, or run `SET SQL_SAFE_UPDATES = 0;` in the tab. The API isn't affected.
- **Result limit:** Workbench shows only 1000 rows by default (the dropdown in the query toolbar). Remember this when checking counts; use `SELECT COUNT(*)` instead of eyeballing.
- **Refresh the sidebar** after a reset, or new tables and procedures won't show.

---

## Part 5: Testing your SQL

Tests live in `db/tests/` and are plain SQL you can open and run in Workbench after a reset.
For each procedure, cover:

```sql
-- ✓ Happy path: show the state before, CALL, then show the state after
SELECT batch_id, quantity_on_hand FROM inventory_batches WHERE product_id = 12;
CALL sell_product(3, 12, 5);
SELECT batch_id, quantity_on_hand FROM inventory_batches WHERE product_id = 12;
SELECT * FROM stock_transactions ORDER BY transaction_id DESC LIMIT 5;

-- ✗ Wrong role: expect "Forbidden: ..."
CALL adjust_stock(<a clerk's id>, 1, -1, 'test');

-- ✗ Too much: expect "Conflict: ..." AND nothing changed (proves ROLLBACK works)
CALL sell_product(3, 12, 999999);
```

> In Workbench, an expected error stops the script. Put each "expect an error" `CALL` at the end, or run it on its own by selecting the line and pressing ⌘↵ / Ctrl+Enter.

Integrity check to run after any change to the import or procedures. It should return **0 rows**:

```sql
SELECT b.batch_id, b.quantity_on_hand, SUM(t.quantity_change) AS logged
FROM inventory_batches b
JOIN stock_transactions t ON t.batch_id = b.batch_id
GROUP BY b.batch_id
HAVING b.quantity_on_hand <> logged;
```

---

## Part 6: Checklist before opening a pull request

- [ ] SQL is saved in the right file under `db/` (and any new file is added to `build-order.txt`)
- [ ] File starts with the header comment and `USE grocery_inventory;`
- [ ] Follows the naming conventions; constraints are named; no `DEFINER=`
- [ ] Procedure errors use `Forbidden:` / `Not found:` / `Conflict:` prefixes
- [ ] `npm run db:reset` finishes with `Done.`
- [ ] Relevant tests in `db/tests/` pass, and the integrity check returns 0 rows
- [ ] If you changed a view's columns or a procedure's parameters, tell Greg (they're the API contract)

---

## Troubleshooting

| You see | Meaning | Fix |
| --- | --- | --- |
| `Access denied for user 'root'@'localhost'` (1045) | Wrong password in `.env` | Fix `DB_PASSWORD` in `server/.env` |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL isn't running | Mac: `brew services start mysql@8.4` or System Settings → MySQL. Windows: Services → MySQL84 → Start |
| `Unknown database 'grocery_inventory'` | Never built, or a reset failed partway | `npm run db:reset` and read the first error |
| `FAILED in <file>, statement N` | The reset found an error | It prints the failing SQL. Fix that file, then reset again |
| `Error 1175: safe update mode` | Workbench safe updates | See Part 4 |
| `Error 3819: Check constraint '...' is violated` | Data breaks a `CHECK` rule | Expected when testing rules; otherwise fix the data or the rule |
| `Error 1451/1452: foreign key constraint fails` | Deleting a referenced row / inserting a missing reference | Create or delete rows in dependency order |
| `Error 1644: <your message>` | Your procedure's `SIGNAL` fired | Working as designed if you expected it |
| `Error 1304: PROCEDURE ... already exists` | Missing `DROP PROCEDURE IF EXISTS` | Add it to the top of the file |
| `npm: command not found` / `bad option: --env-file-if-exists` | Node missing or older than 22 | Install Node 22+ from nodejs.org |
