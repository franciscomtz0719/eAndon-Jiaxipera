import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// API_PORT lets a second dev server point at a test API (e.g. a copy of the database).
const api = `http://localhost:${process.env.API_PORT ?? 4000}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": api,
      "/socket.io": { target: api, ws: true },
    },
  },
});
