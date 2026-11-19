// OWNER: Greg. Thin wrappers around the stored procedures (all stock changes go through them).
// The procedures check roles, lock rows and log transactions; errors they SIGNAL are mapped
// to HTTP status codes by middleware/errors.ts.
//
// TODO (signatures must match db/procedures/*.sql):
//   receiveStock(user, input) → callProcedure("receive_stock", [user.userId, ...])
//   sellProduct(user, input)  → callProcedure("sell_product",  [user.userId, productId, quantity])
//   adjustStock(user, input)  → callProcedure("adjust_stock",  [user.userId, batchId, change, note])
//   disposeExpired(user)      → callProcedure("dispose_expired", [user.userId])
export {};
