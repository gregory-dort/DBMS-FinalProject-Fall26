import { Router } from "express";

export const inventoryRouter = Router();

// OWNER: Greg. TODO — each calls a stored procedure via services/inventory.service.ts:
//   POST /api/inventory/receive          requireRole("CLERK", "MANAGER", "ADMIN") → receive_stock
//   POST /api/inventory/sell             requireRole("CLERK", "MANAGER", "ADMIN") → sell_product
//   POST /api/inventory/adjust           requireRole("MANAGER", "ADMIN")          → adjust_stock
//   POST /api/inventory/dispose-expired  requireRole("MANAGER", "ADMIN")          → dispose_expired
