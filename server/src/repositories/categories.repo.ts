/**
 * WORKED EXAMPLE of the repository layer — the only layer that writes SQL.
 * - Always use ? placeholders for values (prevents SQL injection).
 * - Alias snake_case columns to camelCase so the JSON matches src/types/api.ts.
 */
import type { RowDataPacket } from "mysql2";
import { pool } from "../db/pool.ts";
import type { Category } from "../types/api.ts";

export async function listCategories(): Promise<Category[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT category_id AS categoryId, name FROM categories ORDER BY name`,
  );
  return rows as Category[];
}
