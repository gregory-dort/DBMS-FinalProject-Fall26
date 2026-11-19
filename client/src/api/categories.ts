/** WORKED EXAMPLE: one file per resource, one function per endpoint. */
import type { Category } from "../types";
import { http } from "./http";

export const getCategories = () => http.get<Category[]>("/categories").then((r) => r.data);
