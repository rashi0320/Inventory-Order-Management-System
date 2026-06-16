import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/products': { target: 'http://localhost:8080', changeOrigin: true },
      '/customers': { target: 'http://localhost:8080', changeOrigin: true },
      '/orders': { target: 'http://localhost:8080', changeOrigin: true },
      '/dashboard': { target: 'http://localhost:8080', changeOrigin: true },
      '/seed': { target: 'http://localhost:8080', changeOrigin: true },
    }
  }
})
