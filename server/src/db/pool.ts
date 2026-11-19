import mysql, { type RowDataPacket } from "mysql2/promise";
import { env } from "../config/env.ts";

/**
 * One shared connection pool.
 * - decimalNumbers: DECIMAL columns arrive as numbers, not strings
 * - dateStrings:    DATE/DATETIME arrive as "2026-11-18" strings (no time-zone shifts)
 */
export const pool = mysql.createPool({
  ...env.db,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: true,
});

/**
 * Calls a stored procedure and returns its first result set.
 * `name` must be a hard-coded procedure name — never pass user input as the name.
 *
 *   const [row] = await callProcedure("receive_stock", [userId, productId, ...]);
 */
export async function callProcedure<T = RowDataPacket>(name: string, args: unknown[]): Promise<T[]> {
  const placeholders = args.map(() => "?").join(", ");
  const [results] = await pool.query<RowDataPacket[][]>(`CALL ${name}(${placeholders})`, args);
  // A CALL returns [resultSet1, ..., okPacket]; the first set is what the procedure SELECTed.
  return (Array.isArray(results[0]) ? results[0] : []) as T[];
}
