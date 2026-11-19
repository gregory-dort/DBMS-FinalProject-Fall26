import type { User } from "../types";
import { http } from "./http";

export const getUsers = () => http.get<User[]>("/users").then((r) => r.data);
