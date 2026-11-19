import type { ErrorRequestHandler, RequestHandler } from "express";

/** Throw from routes/services to send a specific status: throw new HttpError(404, "Not found") */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const notFound: RequestHandler = (req, _res, next) =>
  next(new HttpError(404, `No route for ${req.method} ${req.path}`));

/**
 * Turns any error into { error: "message" } JSON.
 * Stored-procedure errors (SIGNAL SQLSTATE '45000') are mapped by their message prefix:
 *   'Forbidden: ...' → 403, 'Not found: ...' → 404, 'Conflict: ...' → 409, other → 400
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err?.code === "ER_SIGNAL_EXCEPTION") {
    const message: string = err.sqlMessage ?? "Request rejected by the database";
    const status = message.startsWith("Forbidden")
      ? 403
      : message.startsWith("Not found")
        ? 404
        : message.startsWith("Conflict")
          ? 409
          : 400;
    res.status(status).json({ error: message });
    return;
  }
  if (err?.code === "ER_CHECK_CONSTRAINT_VIOLATED" || err?.code === "ER_NO_REFERENCED_ROW_2") {
    res.status(400).json({ error: err.sqlMessage });
    return;
  }
  if (err?.code === "ER_DUP_ENTRY") {
    res.status(409).json({ error: err.sqlMessage });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
