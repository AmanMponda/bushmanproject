import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['vue-demi']
  },
  build: {
    // Remove console logs in production builds using esbuild
    minify: 'esbuild',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['bootstrap', '@fortawesome/fontawesome-free'],
          'vendor-charts': ['chart.js', 'apexcharts', 'vue3-apexcharts'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    // Drop console and debugger in production builds
    drop: ['console', 'debugger'],
  },
  // Optimize dev server
  server: {
    hmr: {
      overlay: true,
    },
  },
});
