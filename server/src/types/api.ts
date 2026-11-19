/**
 * Shapes of the JSON the API returns. Keep client/src/types.ts in sync by hand.
 * TODO (Greg): add Product, Batch, Supplier, Transaction, DashboardSummary, ImportIssue
 * once the views in db/schema/02_views.sql are agreed.
 */
export type Role = "CLERK" | "MANAGER" | "ADMIN";

export interface User {
  userId: number;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface Category {
  categoryId: number;
  name: string;
}
