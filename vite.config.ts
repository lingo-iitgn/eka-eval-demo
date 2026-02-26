import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
      ignored: [
        "**/eka_eval/**",
        "**/__pycache__/**",
        "**/results_output/**",
        "**/prompts/**",
        "**/*.json",
        "**/*.py",
        "**/node_modules/**"
      ]
    },
    hmr: {
      host: "lingo.iitgn.ac.in",   // ❗ hostname only
      protocol: "ws",              // ❗ plain ws for HTTP
      clientPort: 80               // ❗ publicly visible port for HTTP
    }
  }
});
