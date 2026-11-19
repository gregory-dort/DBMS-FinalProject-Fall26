/**
 * WORKED EXAMPLE of the route layer: HTTP in, JSON out. No SQL here.
 * Express 5 passes errors thrown in async handlers to errorHandler automatically.
 */
import { Router } from "express";
import * as categoriesService from "../services/categories.service.ts";

export const categoriesRouter = Router();

// GET /api/categories
categoriesRouter.get("/", async (_req, res) => {
  res.json(await categoriesService.listCategories());
});

// TODO: POST / and PATCH /:id with requireRole("MANAGER", "ADMIN")
