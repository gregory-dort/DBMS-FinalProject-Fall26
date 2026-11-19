import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") }, // used by shadcn/ui imports
  },
  server: {
    port: 5173,
    // The browser calls /api/... on :5173 and Vite forwards it to Express — no CORS issues.
    proxy: { "/api": "http://localhost:3001" },
  },
});
