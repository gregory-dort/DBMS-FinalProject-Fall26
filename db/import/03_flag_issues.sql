-- OWNER: Teammate B (import)
-- Data cleaning step 1: convert types in staging and record problems. Rows are KEPT as-is.
--
-- TODO:
--   1. Date shift: compute one offset so MAX(date_received) lands ~1 week before today;
--      apply the same offset to every date column (keeps gaps between dates intact).
--      Parse with STR_TO_DATE(col, '%c/%e/%Y').
--   2. Price: strip '$' and CAST to DECIMAL(10,2).
--   3. Flag (later inserted into import_issues once batches exist):
--        EXPIRES_BEFORE_RECEIVED   expiration_date < date_received
--        MISSING_CATEGORY          catagory = ''
--        CATEGORY_MISMATCH         category differs from the product's most common category
--        PRICE_OUTLIER             price far from the product's median (define the rule here)
--   Dropped columns: percentage, inventory_turnover_rate, last_order_date, supplier_id (random per row).

USE grocery_inventory;
