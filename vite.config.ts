import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html, ctx) {
        // In development, allow localhost connections for HMR
        if (ctx.server) {
          return html.replace(
            /connect-src 'none'/g,
            "connect-src 'self' ws://localhost:* http://localhost:*"
          )
        }
        // In production, keep strict CSP
        return html
      }
    }
  ],
  worker: {
    format: 'es'
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'icojs': ['icojs'],
          'jszip': ['jszip']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts'
  }
})

