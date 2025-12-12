import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isProd = process.env.RAILWAY_PUBLIC_DOMAIN;

const normalizeHost = (value) =>
  value?.replace(/^https?:\/\//, '').replace(/\/$/, '') || '';

const allowedHosts = isProd
  ? [normalizeHost(process.env.RAILWAY_PUBLIC_DOMAIN)]
  : [];

const proxyTarget =
  process.env.VITE_DEV_API_URL ||
  process.env.VITE_API_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:8000';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: isProd ? true : false,
    allowedHosts,
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
    allowedHosts,
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
