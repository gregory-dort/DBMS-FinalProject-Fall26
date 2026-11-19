import { PageStub } from "../components/PageStub";

export function DataIssuesPage() {
  return (
    <PageStub
      title="Data issues"
      todo={[
        "Table of import_issues: issue type, product, lot, detail (from GET /api/reports/import-issues)",
        "Counts per issue type (EXPIRES_BEFORE_RECEIVED, MISSING_CATEGORY, CATEGORY_MISMATCH, PRICE_OUTLIER)",
      ]}
    />
  );
}
