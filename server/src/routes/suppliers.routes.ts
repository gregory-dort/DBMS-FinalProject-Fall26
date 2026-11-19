import { Router } from "express";

export const suppliersRouter = Router();

// OWNER: Greg. TODO:
//   GET   /api/suppliers, GET /api/suppliers/:id                (any user)
//   POST  /api/suppliers, PATCH /api/suppliers/:id              requireRole("MANAGER", "ADMIN")
