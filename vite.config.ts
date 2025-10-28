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
      },
    },
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          // Required for SharedArrayBuffer (FFmpeg.wasm)
          res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          next()
        })
      },
    },
  ],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['@breezystack/lamejs', '@ffmpeg/ffmpeg'],
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: [/@breezystack\/lamejs/, /@ffmpeg\/ffmpeg/, /node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          icojs: ['icojs'],
          jszip: ['jszip'],
          lamejs: ['@breezystack/lamejs'],
          ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
})
