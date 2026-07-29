import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend dev server proxies API + asset requests to the Express backend.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/assets': 'http://localhost:8787',
    },
  },
})
