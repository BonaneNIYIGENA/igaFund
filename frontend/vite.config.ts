/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "igaFund",
        short_name: "igaFund",
        description: "Verified educational funding for students in Rwanda.",
        theme_color: "#1e5945",
        background_color: "#f5f0e6",
        display: "standalone",
        start_url: "/",
      },
    }),
  ],
  server: { proxy: { "/api": "http://127.0.0.1:8000" } },
  test: { environment: "jsdom", globals: true, setupFiles: "./src/test/setup.ts" },
});
