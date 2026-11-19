import { PageStub } from "../components/PageStub";

export function InventoryPage() {
  return (
    <PageStub
      title="Inventory"
      todo={[
        "Receive stock form: product, supplier, lot, quantity, unit cost, expiration date (shadcn Calendar), location",
        "Quick sale form: product + quantity (FEFO is handled by sell_product)",
        "All batches table with filters: expiring within N days, expired, supplier",
      ]}
    />
  );
}
