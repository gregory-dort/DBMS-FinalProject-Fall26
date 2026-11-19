/** Mirror of server/src/types/api.ts — keep the two in sync by hand. */
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

// TODO (Greg): Product, Batch, Supplier, Transaction, DashboardSummary, ImportIssue
