-- OWNER: (Enter Name Here) (procedures)
-- dispose_expired(p_user_id)
--   Roles: MANAGER, ADMIN
--   For every batch with expiration_date < CURDATE() and stock > 0: set on-hand to 0
--   and write a DISPOSAL transaction (negative). Returns number of batches disposed.
--   Pattern + error codes: see receive_stock.sql.
--
-- TODO: implement.

USE grocery_inventory;
