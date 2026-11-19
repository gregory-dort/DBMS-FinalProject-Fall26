import { Router } from "express";
import { listActiveUsers } from "../repositories/users.repo.ts";

export const usersRouter = Router();

// GET /api/users — feeds the demo user picker (no role required)
usersRouter.get("/", async (_req, res) => {
  res.json(await listActiveUsers());
});

// GET /api/users/me — the currently picked user (or null)
usersRouter.get("/me", (req, res) => {
  res.json(req.user ?? null);
});
