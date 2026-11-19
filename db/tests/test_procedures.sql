-- OWNER: Teammate C (procedures)
-- Run after `npm run db:reset`:  mysql -u root -p grocery_inventory < db/tests/test_procedures.sql
-- (or open in MySQL Workbench). Each test: set up → CALL → SELECT to show the result.
--
-- TODO, for each procedure:
--   ✓ happy path (show on-hand before/after + the stock_transactions rows written)
--   ✗ inactive user / wrong role  → expect 'Forbidden: ...'
--   ✗ quantity too large          → expect 'Conflict: ...' and NO rows changed (rollback works)
--   ✗ invalid ids                 → expect 'Not found: ...'
-- Integrity check to run at the end:
--   every batch's quantity_on_hand = SUM(quantity_change) of its transactions.

USE grocery_inventory;
