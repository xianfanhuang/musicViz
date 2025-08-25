import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// GitHub Pages configuration
export default defineConfig({
  plugins: [react()],
  base: '/musicViz/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
})
