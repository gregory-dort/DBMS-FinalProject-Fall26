-- Recreates the database from scratch. Run first by `npm run db:reset`.
DROP DATABASE IF EXISTS grocery_inventory;
CREATE DATABASE grocery_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE grocery_inventory;
