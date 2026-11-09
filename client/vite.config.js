import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// The client runs on 5173. Anything starting with /api is forwarded to the
// Express server on 3001, so the app can call fetch('/api/visits') in dev
// without CORS problems.
//
// `npm run dev:https` starts Vite in "https" mode with a self-signed
// certificate. Phones only allow the microphone on https pages, so this is how
// to try live transcription on a phone. It is for development only.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https' ? [basicSsl()] : [])],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}))
