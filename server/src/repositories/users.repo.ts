import type { RowDataPacket } from "mysql2";
import { pool } from "../db/pool.ts";
import type { User } from "../types/api.ts";

const USER_COLUMNS = `user_id AS userId, username, full_name AS fullName, role, is_active AS isActive`;

// MySQL returns BOOLEAN as 0/1; convert to true/false.
const toUser = (row: RowDataPacket): User => ({ ...(row as User), isActive: Boolean(row.isActive) });

export async function listActiveUsers(): Promise<User[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${USER_COLUMNS} FROM users WHERE is_active = 1 ORDER BY role, full_name`,
  );
  return rows.map(toUser);
}

export async function findUserById(userId: number): Promise<User | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${USER_COLUMNS} FROM users WHERE user_id = ?`,
    [userId],
  );
  return rows[0] ? toUser(rows[0]) : null;
}
