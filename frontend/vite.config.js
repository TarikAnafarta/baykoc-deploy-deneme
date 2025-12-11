import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeHost = (value) => value?.replace(/^https?:\/\//, '').replace(/\/$/, '') || '';
const splitHosts = (value) =>
  value
    .split(/[,\s]+/)
    .map((entry) => normalizeHost(entry))
    .filter(Boolean);

const allowedHostSources = [
  process.env.VITE_ALLOWED_HOSTS,
  process.env.VITE_ALLOWED_HOST,
  process.env.FRONTEND_URL,
  process.env.PUBLIC_HOST,
  process.env.RAILWAY_STATIC_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN,
].filter(Boolean);

const allowedHosts = Array.from(
  new Set(
    allowedHostSources.flatMap((entry) =>
      Array.isArray(entry) ? entry.map((val) => normalizeHost(val)) : splitHosts(String(entry)),
    ),
  ),
);

if (allowedHosts.length === 0) {
  allowedHosts.push('localhost');
}

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
