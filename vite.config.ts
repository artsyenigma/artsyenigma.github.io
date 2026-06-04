import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set base to "/" for username.github.io, or "/repo-name/" for project pages
export default defineConfig({
  plugins: [react()],
  base: "/",
});
