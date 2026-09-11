import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // React's automatic JSX runtime is configured in tsconfig; avoiding the
  // refresh transform keeps stale browser HMR clients from crashing startup.
  plugins: [],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
