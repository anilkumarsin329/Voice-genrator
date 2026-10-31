import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development /api is proxied to the Express backend. In production set VITE_API_URL.
    proxy: { '/api': process.env.VITE_PROXY_TARGET || 'http://localhost:5000' },
  },
})
