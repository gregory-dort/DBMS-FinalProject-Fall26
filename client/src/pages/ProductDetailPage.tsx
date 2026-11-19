import { useParams } from "react-router-dom";
import { PageStub } from "../components/PageStub";

export function ProductDetailPage() {
  const { id } = useParams();
  return (
    <PageStub
      title={`Product #${id}`}
      todo={[
        "Header: name, category, price, on hand vs min stock, edit (MANAGER/ADMIN)",
        "Batches table: lot, supplier, on hand, received, expiration (highlight expired/expiring), import-issue badge",
        "Suppliers for this product with status (Active / Backordered / Discontinued)",
        "Actions: Receive stock, Sell, Adjust batch (MANAGER/ADMIN); show procedure errors from the API",
        "Recent transactions for this product",
      ]}
    />
  );
}
