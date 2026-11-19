import type { RequestHandler } from "express";
import type { Role } from "../types/api.ts";
import { findUserById } from "../repositories/users.repo.ts";
import { HttpError } from "./errors.ts";

/**
 * Demo user picker: the client sends the chosen user's id in the X-User-Id header.
 * There is NO password check — see docs/PROJECT_PLAN.md (Authentication).
 */
export const loadCurrentUser: RequestHandler = async (req, _res, next) => {
  const header = req.header("X-User-Id");
  if (header) {
    const user = await findUserById(Number(header));
    if (user?.isActive) req.user = user;
  }
  next();
};

/** Route guard: router.post("/adjust", requireRole("MANAGER", "ADMIN"), handler) */
export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Pick a user first"));
    if (!allowed.includes(req.user.role)) {
      return next(new HttpError(403, `Forbidden: ${req.user.role} cannot do this`));
    }
    next();
  };
}
