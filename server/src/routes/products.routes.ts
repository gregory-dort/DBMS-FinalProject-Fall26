import { Router } from "express";

export const productsRouter = Router();

// OWNER: Greg. TODO — see "API contract" in docs/PROJECT_PLAN.md:
//   GET    /api/products?search=&categoryId=&lowStock=&page=   (any user)
//   GET    /api/products/:id                                   (any user) — includes batches + suppliers
//   POST   /api/products            requireRole("MANAGER", "ADMIN")
//   PATCH  /api/products/:id        requireRole("MANAGER", "ADMIN")
