import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  root: ".",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./client"),
    },
  },
  build: {
    outDir: "dist/client",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
      "/openapi": { target: "http://localhost:3000", changeOrigin: true },
      "/docs": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
