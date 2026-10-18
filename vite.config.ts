import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In development Vite serves the app on :5173 and forwards /api to the
// Express server on :3000. In production Express serves the built files and
// the API from a single port (see server/index.ts).
const API_PORT = Number(process.env.API_PORT) || 3000;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": `http://localhost:${API_PORT}`,
    },
  },
});
