import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "..",
  build: {
    sourcemap: false,
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-leaflet": ["leaflet", "react-leaflet"],
          "vendor-charts": ["recharts"],
          "vendor-icons": ["lucide-react"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
