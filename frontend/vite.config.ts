import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const BACKEND_DEV_URL = 'http://localhost:8000'
const API_PREFIX = '/api'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      [API_PREFIX]: {
        target: BACKEND_DEV_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${API_PREFIX}`), ''),
      },
    },
  },
})
