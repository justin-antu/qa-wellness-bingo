import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set `base` to "/<your-repo-name>/" before deploying to GitHub Pages
// (project pages are served from https://<user>.github.io/<repo-name>/).
// See README.md for details.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
