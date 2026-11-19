import { Router } from "express";

export const reportsRouter = Router();

// OWNER: Greg. TODO:
//   GET /api/reports/dashboard          → v_dashboard_summary
//   GET /api/reports/expiring?days=7    → v_expiring_batches
//   GET /api/reports/low-stock          → v_product_stock WHERE is_low_stock
//   GET /api/reports/import-issues      → import_issues (data-quality panel)
