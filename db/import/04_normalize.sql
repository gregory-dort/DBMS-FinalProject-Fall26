-- OWNER: Teammate B (import)
-- Data cleaning step 2: INSERT ... SELECT from staging into the real tables.
--
-- TODO (in this order):
--   categories         ← DISTINCT non-empty catagory
--   suppliers          ← DISTINCT supplier_name
--   products           ← DISTINCT product_name; category = most common one for that name;
--                        unit_price and min_stock_level aggregated across rows (document the rule)
--   product_suppliers  ← DISTINCT (product, supplier) with status + reorder_quantity
--   inventory_batches  ← one per staging row; lot_number = CSV Product_ID
--   stock_transactions ← per batch: RECEIVE (stock + sales_volume) and SALE (-sales_volume),
--                        user = 'system_import', so on-hand always equals SUM(quantity_change)
--   import_issues      ← the flags from 03_flag_issues.sql, linked to batch_id
--   DROP TABLE staging_inventory (optional — keep it while debugging)

USE grocery_inventory;
