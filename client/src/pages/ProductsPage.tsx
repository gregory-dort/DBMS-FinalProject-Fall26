import { PageStub } from "../components/PageStub";

export function ProductsPage() {
  return (
    <PageStub
      title="Products"
      todo={[
        "Searchable, filterable table (shadcn Data Table): name, category, on hand, min stock, low-stock badge, next expiration",
        "Filters: search, category, low stock only",
        "'Add product' dialog (MANAGER/ADMIN)",
        "Row click → /products/:id",
      ]}
    />
  );
}
