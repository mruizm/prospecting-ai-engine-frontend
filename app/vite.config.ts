import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const bffTarget = env.VITE_BFF_URL || "http://localhost:4000";
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": { target: bffTarget, changeOrigin: true },
        "/auth": { target: bffTarget, changeOrigin: true },
      },
    },
  };
});
