import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Railway frontend domainini buraya eklemelisin:
const allowedHost = 'frontend-production-fda7.up.railway.app';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true,
    allowedHosts: [allowedHost],

    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  preview: {
    host: true,
    port: 4173,
    allowedHosts: [allowedHost],
  },

  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          d3: ['d3'],
        },
      },
    },
  },
});
