import { Router } from "express";
import { categoriesRouter } from "./categories.routes.ts";
import { inventoryRouter } from "./inventory.routes.ts";
import { productsRouter } from "./products.routes.ts";
import { reportsRouter } from "./reports.routes.ts";
import { suppliersRouter } from "./suppliers.routes.ts";
import { transactionsRouter } from "./transactions.routes.ts";
import { usersRouter } from "./users.routes.ts";

/** Everything mounted under /api */
export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});
apiRouter.use("/users", usersRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/suppliers", suppliersRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/transactions", transactionsRouter);
apiRouter.use("/reports", reportsRouter);
