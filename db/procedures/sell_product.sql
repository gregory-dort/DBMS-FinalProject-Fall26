-- OWNER: Teammate C (procedures)
-- sell_product(p_user_id, p_product_id, p_quantity)
--   Roles: CLERK, MANAGER, ADMIN
--   Takes stock FEFO (first-expired, first-out) across batches, skipping expired ones.
--   Lock candidate batches with SELECT ... FOR UPDATE; one SALE transaction per batch touched.
--   SIGNAL 'Conflict: Insufficient stock: requested X, available Y' if not enough.
--   Pattern + error codes: see receive_stock.sql.
--
-- TODO: implement (a cursor or a loop over the locked batches).

USE grocery_inventory;
