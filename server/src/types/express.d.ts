import type { User } from "./api.ts";

declare global {
  namespace Express {
    interface Request {
      /** The demo user picked in the UI (from the X-User-Id header). Set by loadCurrentUser. */
      user?: User;
    }
  }
}
