import { getCategories } from "../api/categories";
import { PageStub } from "../components/PageStub";
import { useApi } from "../hooks/useApi";

export function DashboardPage() {
  // WORKED EXAMPLE of useApi: page → hook → api/categories.ts → Express → MySQL.
  const { data: categories, loading, error } = useApi(getCategories);

  return (
    <div className="space-y-8">
      <PageStub
        title="Dashboard"
        todo={[
          "Stat cards from GET /api/reports/dashboard (products, low stock, expiring in 7 days, expired, inventory value)",
          "Expiring-soon table from GET /api/reports/expiring?days=7",
          "Low-stock table from GET /api/reports/low-stock",
          "'Dispose expired' button (MANAGER/ADMIN) → POST /api/inventory/dispose-expired, then reload()",
        ]}
      />
      <section className="rounded border bg-white p-4">
        <h3 className="mb-2 font-medium">Connection check: categories</h3>
        {loading && <p className="text-sm text-neutral-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {categories && <p className="text-sm">{categories.map((c) => c.name).join(", ") || "(none yet)"}</p>}
      </section>
    </div>
  );
}
