-- OWNER: (Enter Name Here) (schema)
-- Created AFTER the import, so it only applies to rows added through the app.
--
-- TODO:
--   BEFORE INSERT ON inventory_batches:
--     SIGNAL SQLSTATE '45000' if expiration_date < received_date
--
-- NOTE: write it with DELIMITER $$ ... $$ (the reset runner understands DELIMITER).

USE grocery_inventory;
