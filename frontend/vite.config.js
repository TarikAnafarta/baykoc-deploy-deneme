import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeHost = (value) => value?.replace(/^https?:\/\//, '').replace(/\/$/, '') || '';

const rawAllowedHost =
  process.env.VITE_ALLOWED_HOST ||
  process.env.FRONTEND_URL ||
  process.env.PUBLIC_HOST ||
  '';
const allowedHost = normalizeHost(rawAllowedHost) || 'localhost';

const proxyTarget =
  process.env.VITE_DEV_API_URL ||
  process.env.VITE_API_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:8000';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true,
    allowedHosts: allowedHost ? [allowedHost] : [],

    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },

  preview: {
    host: true,
    port: 4173,
    allowedHosts: allowedHost ? [allowedHost] : [],
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
