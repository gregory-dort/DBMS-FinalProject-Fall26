-- OWNER: Teammate A (schema)
-- Read-side views used by the API. Their column names are part of the API contract.
--
-- TODO:
--   v_product_stock      one row per product: total on hand (SUM of batches), min_stock_level,
--                        is_low_stock, next expiration date, category name
--   v_expiring_batches   batches with stock > 0 and days_until_expiration (DATEDIFF vs CURDATE())
--   v_dashboard_summary  single row: product count, low-stock count, expiring-in-7-days,
--                        expired-with-stock, inventory value

USE grocery_inventory;
