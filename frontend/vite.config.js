// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react({
//       babel: {
//         plugins: [['babel-plugin-react-compiler']],
//       },
//     }),
//   ],
// })

// import { defineConfig } from "vite";
// import { nodePolyfills } from "vite-plugin-node-polyfills";
// import react from "@vitejs/plugin-react";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), nodePolyfills()],
//   define: {
//     global: "globalThis",
//   },
//   resolve: {
//     alias: {
//       buffer: "buffer",
//     },
//   },
//   optimizeDeps: {
//     include: ["buffer", "wkx"],
//   },
// });

import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  optimizeDeps: {
    include: ["buffer", "wkx"],
  },
  server: {
    // Tăng timeout để tránh lỗi transformation
    hmr: {
      timeout: 30000,
    },
  },
  build: {
    // Tăng chunk size limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          utils: ["axios", "lodash"],
        },
      },
    },
  },
});
