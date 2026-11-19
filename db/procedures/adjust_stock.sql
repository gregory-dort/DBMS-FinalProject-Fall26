-- OWNER: Teammate C (procedures)
-- adjust_stock(p_user_id, p_batch_id, p_quantity_change, p_note)
--   Roles: MANAGER, ADMIN
--   Cycle-count corrections / damage. p_note is required. Result must stay >= 0
--   and <= quantity_received. Writes an ADJUSTMENT transaction.
--   Pattern + error codes: see receive_stock.sql.
--
-- TODO: implement.

USE grocery_inventory;
