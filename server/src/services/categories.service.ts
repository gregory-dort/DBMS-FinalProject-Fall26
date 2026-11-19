/**
 * WORKED EXAMPLE of the service layer: business logic between routes and repositories.
 * Trivial here; services matter for things like inventory.service.ts.
 */
import * as categoriesRepo from "../repositories/categories.repo.ts";

export const listCategories = () => categoriesRepo.listCategories();
