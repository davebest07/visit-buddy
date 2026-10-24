import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The client runs on 5173. Anything starting with /api is forwarded to the
// Express server on 3001, so the app can call fetch('/api/visits') in dev
// without CORS problems.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
