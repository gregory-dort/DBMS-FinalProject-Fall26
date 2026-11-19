import axios from "axios";

const USER_KEY = "demoUserId";

/** All API calls go through this instance. baseURL /api is proxied to Express by Vite. */
export const http = axios.create({ baseURL: "/api" });

// Demo user picker: send the picked user's id with every request.
http.interceptors.request.use((config) => {
  const userId = getStoredUserId();
  if (userId) config.headers.set("X-User-Id", String(userId));
  return config;
});

/** Pulls the server's { error } message out of an Axios error, for showing in the UI. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response?.data?.error ?? err.message;
  return err instanceof Error ? err.message : String(err);
}

export function getStoredUserId(): number | null {
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export function storeUserId(userId: number | null) {
  try {
    if (userId) localStorage.setItem(USER_KEY, String(userId));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* private mode — the pick just won't survive a reload */
  }
}
